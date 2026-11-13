/* 바코드 · QR 코드 생성기
 * 라이브러리: JsBarcode (바코드), qrcode-generator (QR) — CDN에서 불러옴
 * 모든 처리는 브라우저 안에서만 이뤄짐 (서버 없음)
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PX_PER_MM = 96 / 25.4; // 화면 기준 (CSS px)
  const EXPORT_DPI = 300;      // mm 입력 시 PNG 해상도
  const MIN_MODULE_MM = 0.19;  // 이보다 가는 막대는 스캔이 어려움

  const FORMATS = ["CODE128", "EAN13", "EAN8", "UPC", "CODE39", "ITF14", "ITF", "codabar",
    "CODE128A", "CODE128B", "CODE128C", "MSI", "MSI10", "MSI11", "MSI1010", "MSI1110", "pharmacode"];

  const QR_TYPES = {
    text:  { fields: [["text", "QR 데이터 입력"]], build: (v) => v.text },
    wifi:  { fields: [["ssid", "와이파이 이름"], ["pass", "비밀번호"]],
             build: (v) => {
               if (!v.ssid) return "";
               const esc = (s) => s.replace(/([\\;,:"])/g, "\\$1");
               return v.pass ? `WIFI:T:WPA;S:${esc(v.ssid)};P:${esc(v.pass)};;` : `WIFI:T:nopass;S:${esc(v.ssid)};;`;
             } },
    tel:   { fields: [["tel", "전화번호"]], build: (v) => (v.tel ? "tel:" + v.tel.replace(/[^\d+]/g, "") : "") },
    sms:   { fields: [["tel", "전화번호"], ["msg", "메시지"]],
             build: (v) => (v.tel ? `SMSTO:${v.tel.replace(/[^\d+]/g, "")}:${v.msg || ""}` : "") },
    email: { fields: [["to", "이메일 주소"], ["subject", "제목"], ["body", "내용"]],
             build: (v) => {
               if (!v.to) return "";
               const q = [];
               if (v.subject) q.push("subject=" + encodeURIComponent(v.subject));
               if (v.body) q.push("body=" + encodeURIComponent(v.body));
               return `mailto:${v.to.trim()}${q.length ? "?" + q.join("&") : ""}`;
             } },
  };

  const PRESETS = {
    s: { "bc-width": 1, "bc-height": 60, "bc-font-size": 14, "qr-size": 160 },
    m: { "bc-width": 2, "bc-height": 100, "bc-font-size": 20, "qr-size": 240 },
    l: { "bc-width": 3, "bc-height": 150, "bc-font-size": 28, "qr-size": 400 },
  };

  const RANGES = ["bc-width", "bc-height", "bc-margin", "bc-font-size", "bc-text-margin", "qr-size", "qr-margin"];
  const SELECTS = ["bc-text-align", "bc-font", "bc-font-opt", "qr-ecl"];

  const state = { mode: "barcode", qrType: "text", qrValues: {}, textPos: "bottom" };
  let current = { kind: null };

  // ---------- 저장/복원 ----------
  const STORE = "barcode-qr-maker:v4";
  const SAVE_IDS = ["bc-value", "bc-format", "qr-type", "fg", "bg", "size-w", "size-h", ...RANGES, ...SELECTS];
  function save() {
    try {
      const d = { mode: state.mode, qrValues: state.qrValues, textPos: state.textPos, bgNone: $("bg-none").checked };
      SAVE_IDS.forEach((id) => (d[id] = $(id).value));
      localStorage.setItem(STORE, JSON.stringify(d));
    } catch (_) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (_) { return {}; }
  }

  // ---------- 공통 도우미 ----------
  const num = (id, def) => { const v = parseFloat($(id).value); return Number.isFinite(v) && v >= 0 ? v : def; };
  const r2 = (n) => Math.round(n * 100) / 100;
  const escXml = (s) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]));
  const bgColor = () => ($("bg-none").checked ? null : $("bg").value);

  // mm 입력이 있으면 { w, h } (mm), 없으면 null
  function mmSize() {
    const w = parseFloat($("size-w").value), h = parseFloat($("size-h").value);
    if (state.mode === "qr") return w > 0 ? { w, h: w } : null;
    return w > 0 && h > 0 ? { w, h } : null;
  }

  // ---------- UI ----------
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
    const isQr = mode === "qr";
    $("barcode-input").hidden = isQr;
    $("qr-input").hidden = !isQr;
    document.querySelector(".grid2.bc").hidden = isQr;
    document.querySelector(".grid2.qr").hidden = !isQr;
    document.querySelectorAll(".bc-only").forEach((e) => (e.hidden = isQr));
    $("size-h").disabled = isQr; // QR은 정사각형
    render();
  }

  function renderQrFields() {
    state.qrType = $("qr-type").value;
    const box = $("qr-fields");
    box.innerHTML = "";
    const vals = (state.qrValues[state.qrType] ||= {});
    QR_TYPES[state.qrType].fields.forEach(([k, ph]) => {
      const el = document.createElement("input");
      el.type = "text";
      el.placeholder = ph;
      el.autocomplete = "off";
      el.value = vals[k] || "";
      el.addEventListener("input", () => { vals[k] = el.value; render(); });
      box.appendChild(el);
    });
  }

  function setTextPos(pos) {
    state.textPos = pos;
    document.querySelectorAll("#text-pad button").forEach((b) => b.classList.toggle("active", b.dataset.pos === pos));
    $("bc-text-align").closest(".field").hidden = !(pos === "top" || pos === "bottom");
  }

  // mm 입력 중이면 크기 버튼/너비·높이 슬라이더를 잠금 표시
  function syncSizeUi() {
    const mm = mmSize();
    $("mm-box").classList.toggle("on", !!mm);
    $("size-seg").classList.toggle("off", !!mm);
    ["bc-width", "bc-height", "qr-size"].forEach((id) => {
      $(id).disabled = !!mm;
      $(id).closest(".field").classList.toggle("locked", !!mm);
    });
    if (state.mode === "qr" && $("size-w").value) $("size-h").value = $("size-w").value;
  }

  function setReady(ok) { ["dl-png", "dl-svg", "copy", "print"].forEach((id) => ($(id).disabled = !ok)); }
  function showMsg(msg, warn) { $("error").textContent = msg || ""; $("error").className = warn ? "warn" : "error"; }
  function clearPreview() {
    $("bc-holder").innerHTML = "";
    $("qr-canvas").hidden = true;
    $("dim").textContent = "";
    setReady(false);
    current = { kind: null };
  }

  function render() {
    save();
    syncSizeUi();
    $("bg").disabled = $("bg-none").checked;
    showMsg("");
    if (state.mode === "qr") renderQr();
    else renderBarcode();
  }

  // ---------- 바코드 ----------
  function barcodeData() {
    let v = $("bc-value").value;
    if (/^CODE128/.test($("bc-format").value)) v = v.replace(/\\F/g, String.fromCharCode(207)); // \F → FNC1
    return v;
  }

  // 막대 두께/높이를 지정해서 바코드 하나를 그림 → { body, w, h } (단위: CSS px)
  function buildBarcode(barWidth, barHeight) {
    const pos = state.textPos;
    const native = pos === "top" || pos === "bottom";
    const fg = $("fg").value;
    const fontSize = num("bc-font-size", 20);
    const margin = num("bc-margin", 10);

    const tmp = document.createElementNS(SVG_NS, "svg");
    let valid = true;
    try {
      JsBarcode(tmp, barcodeData(), {
        format: $("bc-format").value,
        width: barWidth,
        height: barHeight,
        margin,
        background: "transparent",
        lineColor: fg,
        displayValue: native,
        textPosition: native ? pos : "bottom",
        textAlign: $("bc-text-align").value,
        font: $("bc-font").value,
        fontOptions: $("bc-font-opt").value,
        fontSize,
        textMargin: num("bc-text-margin", 2),
        valid: (ok) => (valid = ok),
      });
    } catch (_) { valid = false; }
    if (!valid) return null;

    const w = parseFloat(tmp.getAttribute("width"));
    const h = parseFloat(tmp.getAttribute("height"));
    if (pos !== "left" && pos !== "right") {
      return { body: `<svg x="0" y="0" width="${w}" height="${h}">${tmp.innerHTML}</svg>`, w, h };
    }

    // 왼쪽 / 오른쪽: 바코드 옆 세로 가운데에 글자
    const label = $("bc-value").value.replace(/\\F/g, "");
    const font = $("bc-font").value, fopt = $("bc-font-opt").value;
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${fopt} ${fontSize}px ${font}`.trim();
    const tw = Math.ceil(ctx.measureText(label).width);
    const gap = Math.round(fontSize * 0.3) + num("bc-text-margin", 2);
    const W = w + tw + gap;
    const textX = pos === "left" ? margin : w - margin + gap;
    const bcX = pos === "left" ? tw + gap : 0;
    const body =
      `<svg x="${bcX}" y="0" width="${w}" height="${h}">${tmp.innerHTML}</svg>` +
      `<text x="${textX}" y="${h / 2}" dominant-baseline="central" font-family="${font}" font-size="${fontSize}"` +
      `${/bold/.test(fopt) ? ' font-weight="bold"' : ""}${/italic/.test(fopt) ? ' font-style="italic"' : ""} fill="${fg}">${escXml(label)}</text>`;
    return { body, w: W, h };
  }

  // 원하는 전체 크기(px)에 맞도록 막대 두께·높이를 계산 (크기는 두께·높이에 비례하므로 두 번 재서 역산)
  function fitBarcode(targetW, targetH) {
    const a = buildBarcode(1, 10), b = buildBarcode(2, 10), c = buildBarcode(1, 20);
    if (!a || !b || !c) return null;
    const kw = b.w - a.w, kh = (c.h - a.h) / 10;
    const bw = (targetW - (a.w - kw)) / kw;
    const bh = (targetH - (a.h - 10 * kh)) / kh;
    if (!(bw > 0.05) || !(bh > 1)) return { tooSmall: true };
    const r = buildBarcode(bw, bh);
    r.moduleMm = bw / PX_PER_MM;
    return r;
  }

  function wrapSvg(body, w, h, mm) {
    const bg = bgColor();
    const size = mm ? `width="${mm.w}mm" height="${mm.h}mm"` : `width="${r2(w)}" height="${r2(h)}"`;
    return `<svg xmlns="${SVG_NS}" ${size} viewBox="0 0 ${r2(w)} ${r2(h)}">` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : "") + body + `</svg>`;
  }

  function renderBarcode() {
    $("qr-canvas").hidden = true;
    if (!$("bc-value").value) return clearPreview();
    if (!window.JsBarcode) { clearPreview(); return showMsg("라이브러리를 불러오지 못했어요. 인터넷 연결을 확인하세요."); }

    const mm = mmSize();
    let r;
    if (mm) {
      r = fitBarcode(mm.w * PX_PER_MM, mm.h * PX_PER_MM);
      if (r && r.tooSmall) { clearPreview(); return showMsg("크기가 너무 작아요. mm 값을 늘리거나 여백·글자 크기를 줄이세요."); }
    } else {
      r = buildBarcode(Math.max(1, num("bc-width", 2)), Math.max(1, num("bc-height", 100)));
    }
    if (!r) { clearPreview(); return showMsg(`${$("bc-format").value} 형식에 맞지 않는 데이터`); }

    const svg = wrapSvg(r.body, r.w, r.h, mm);
    $("bc-holder").innerHTML = svg;
    $("bc-holder").firstElementChild.style.width = r.w + "px";

    const scale = mm ? EXPORT_DPI / 96 : 1;
    current = { kind: "barcode", svg, pw: Math.round(r.w * scale), ph: Math.round(r.h * scale) };
    $("dim").textContent = mm
      ? `${mm.w} × ${mm.h} mm · PNG ${current.pw} × ${current.ph} px (${EXPORT_DPI}dpi)`
      : `${Math.round(r.w)} × ${Math.round(r.h)} px`;
    if (mm && r.moduleMm < MIN_MODULE_MM)
      showMsg(`막대가 너무 가늘어요 (${r2(r.moduleMm)}mm). 스캔이 안 될 수 있어요`, true);
    setReady(true);
  }

  // ---------- QR ----------
  if (window.qrcode) qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s)); // 한글 지원

  function renderQr() {
    $("bc-holder").innerHTML = "";
    const text = QR_TYPES[state.qrType].build(state.qrValues[state.qrType] || {});
    if (!text) return clearPreview();
    if (!window.qrcode) { clearPreview(); return showMsg("라이브러리를 불러오지 못했어요. 인터넷 연결을 확인하세요."); }

    let qr;
    try { qr = qrcode(0, $("qr-ecl").value); qr.addData(text, "Byte"); qr.make(); }
    catch (_) { clearPreview(); return showMsg("내용이 너무 길어요"); }

    const mm = mmSize();
    const viewPx = mm ? mm.w * PX_PER_MM : Math.max(50, Math.round(num("qr-size", 240)));
    const size = mm ? Math.round((mm.w / 25.4) * EXPORT_DPI) : viewPx; // 실제 픽셀 수
    const margin = Math.round(num("qr-margin", 2));
    const n = qr.getModuleCount();
    const total = n + margin * 2;
    const cell = Math.max(1, Math.floor(size / total));
    const off = Math.floor((size - cell * total) / 2) + margin * cell;
    const fg = $("fg").value, bg = bgColor();

    const canvas = $("qr-canvas");
    canvas.width = canvas.height = size;
    canvas.style.width = Math.min(viewPx, 360) + "px";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size); }
    ctx.fillStyle = fg;
    let d = "";
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (qr.isDark(r, c)) {
          ctx.fillRect(off + c * cell, off + r * cell, cell, cell);
          d += `M${c + margin},${r + margin}h1v1h-1z`;
        }
    canvas.hidden = false;

    const sizeAttr = mm ? `width="${mm.w}mm" height="${mm.w}mm"` : `width="${size}" height="${size}"`;
    const svg = `<svg xmlns="${SVG_NS}" ${sizeAttr} viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : "") + `<path d="${d}" fill="${fg}"/></svg>`;

    current = { kind: "qr", svg, pw: size, ph: size };
    $("dim").textContent = mm ? `${mm.w} × ${mm.w} mm · PNG ${size} × ${size} px (${EXPORT_DPI}dpi)` : `${size} × ${size} px`;
    if (mm && (mm.w / total) < 0.25) showMsg("QR 칸이 너무 작아요. 크기를 키우는 걸 권장해요", true);
    setReady(true);
  }

  // ---------- 저장 / 복사 / 인쇄 ----------
  function fileBase() {
    const tidy = (s) => (s || "").replace(/^[a-z]+:(\/\/)?/i, "").replace(/[^\w가-힣.-]+/g, "_").slice(0, 40);
    if (current.kind === "qr") {
      const v = state.qrValues[state.qrType] || {};
      const main = { text: v.text, wifi: v.ssid, tel: v.tel, sms: v.tel, email: v.to }[state.qrType];
      return ["qr", tidy(main)].filter(Boolean).join("_"); // 비밀번호·본문은 파일 이름에 넣지 않음
    }
    return "barcode_" + (tidy($("bc-value").value) || "code");
  }

  function getPngBlob() {
    return new Promise((resolve, reject) => {
      if (current.kind === "qr") return $("qr-canvas").toBlob(resolve, "image/png");
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = current.pw;
        c.height = current.ph;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(resolve, "image/png");
      };
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(current.svg);
    });
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  $("dl-png").addEventListener("click", async () => {
    try { download(await getPngBlob(), fileBase() + ".png"); toast("PNG 저장"); }
    catch (_) { toast("저장에 실패했어요"); }
  });
  $("dl-svg").addEventListener("click", () => {
    download(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + current.svg], { type: "image/svg+xml" }), fileBase() + ".svg");
    toast("SVG 저장");
  });
  $("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": getPngBlob() })]);
      toast("이미지 복사됨");
    } catch (_) { toast("이 브라우저에서는 복사가 안 돼요"); }
  });
  $("print").addEventListener("click", () => window.print());

  // ---------- 이벤트 ----------
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
  document.querySelectorAll("#text-pad button").forEach((b) => b.addEventListener("click", () => { setTextPos(b.dataset.pos); render(); }));

  $("bc-format").addEventListener("change", render);
  $("qr-type").addEventListener("change", () => { renderQrFields(); render(); });
  ["bc-value", "fg", "bg", "bg-none", "size-w", "size-h", ...SELECTS].forEach((id) => $(id).addEventListener("input", render));

  const showRange = (id) => ($(id + "-v").textContent = $(id).value);
  RANGES.forEach((id) =>
    $(id).addEventListener("input", () => {
      showRange(id);
      if (["bc-width", "bc-height", "bc-font-size", "qr-size"].includes(id))
        document.querySelectorAll("#size-seg button").forEach((b) => b.classList.remove("active"));
      render();
    })
  );

  document.querySelectorAll("#size-seg button").forEach((btn) =>
    btn.addEventListener("click", () => {
      $("size-w").value = ""; $("size-h").value = ""; // 크기 버튼을 누르면 mm 입력 해제
      document.querySelectorAll("#size-seg button").forEach((b) => b.classList.toggle("active", b === btn));
      Object.entries(PRESETS[btn.dataset.size]).forEach(([id, v]) => { $(id).value = v; showRange(id); });
      render();
    })
  );

  $("reset-color").addEventListener("click", () => {
    $("fg").value = "#000000"; $("bg").value = "#ffffff"; $("bg-none").checked = false; render();
  });

  // ---------- 시작 ----------
  const sel = $("bc-format");
  FORMATS.forEach((id) => { const o = document.createElement("option"); o.value = o.textContent = id; sel.appendChild(o); });

  const saved = load();
  SAVE_IDS.forEach((id) => {
    if (saved[id] === undefined) return;
    if (id === "bc-format" && !FORMATS.includes(saved[id])) return;
    if (id === "qr-type" && !QR_TYPES[saved[id]]) return;
    $(id).value = saved[id];
  });
  if (saved.qrValues) state.qrValues = saved.qrValues;
  $("bg-none").checked = !!saved.bgNone;
  setTextPos(["top", "bottom", "left", "right", "none"].includes(saved.textPos) ? saved.textPos : "bottom");

  RANGES.forEach(showRange);
  const presetOf = Object.keys(PRESETS).find((k) => Object.entries(PRESETS[k]).every(([id, v]) => +$(id).value === v));
  document.querySelectorAll("#size-seg button").forEach((b) => b.classList.toggle("active", b.dataset.size === presetOf));

  renderQrFields();
  setMode(saved.mode === "qr" ? "qr" : "barcode");
})();
