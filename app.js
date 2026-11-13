/* 바코드 · QR 코드 생성기
 * 라이브러리: JsBarcode (바코드), qrcode-generator (QR) — CDN에서 불러옴
 * 모든 처리는 브라우저 안에서만 이뤄짐 (서버 없음)
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";

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

  const state = { mode: "barcode", qrType: "text", qrValues: {}, textPos: "bottom", extra: [] };
  let current = { kind: null };

  // ---------- 저장/복원 ----------
  const STORE = "barcode-qr-maker:v4";
  const SAVE_IDS = ["bc-value", "bc-format", "qr-type", "fg", "bg", ...RANGES, ...SELECTS];
  function save() {
    try {
      const d = { mode: state.mode, qrValues: state.qrValues, textPos: state.textPos, bgNone: $("bg-none").checked, fit: $("fit").checked, extra: state.extra };
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

  // ---------- UI ----------
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
    const isQr = mode === "qr";
    $("barcode-input").hidden = isQr;
    $("qr-input").hidden = !isQr;
    $("bc-extra").hidden = isQr;
    syncAddButton();
    document.querySelector(".grid2.bc").hidden = isQr;
    document.querySelector(".grid2.qr").hidden = !isQr;
    document.querySelectorAll(".bc-only").forEach((e) => (e.hidden = isQr));
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

  function setReady(ok) { ["dl-png", "dl-svg", "copy", "print"].forEach((id) => ($(id).disabled = !ok)); }
  function showMsg(msg, warn) { $("error").textContent = msg || ""; $("error").className = warn ? "warn" : "error"; }
  function clearPreview() {
    $("bc-holder").innerHTML = "";
    $("qr-canvas").hidden = true;
    $("dim").textContent = "";
    setReady(false);
    current = { kind: null };
  }

  // 화면에 맞추기: 미리보기 상자보다 크면 상자 폭에 맞춰 줄여서 보여줌 (저장 크기는 그대로)
  function applyFit() {
    if (!current.kind) return;
    const el = current.kind === "qr" ? $("qr-canvas") : $("bc-holder").firstElementChild;
    if (!el) return;
    const box = $("preview");
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const w = $("fit").checked ? Math.min(current.viewW, avail) : current.viewW;
    el.style.width = Math.max(1, Math.floor(w)) + "px";
  }

  function render() {
    save();
    $("bg").disabled = $("bg-none").checked;
    showMsg("");
    if (state.mode === "qr") renderQr();
    else renderBarcode();
  }

  // ---------- 바코드 ----------
  const MAX_BARCODES = 3;
  const STACK_GAP = 16; // 여러 바코드 사이 간격 (CSS px)

  // 화면에 그릴 바코드 목록: 첫 줄 + 추가한 줄들
  function barcodeItems() {
    return [{ value: $("bc-value").value, format: $("bc-format").value }, ...state.extra]
      .map((it, i) => ({ ...it, n: i + 1 }));
  }

  function barcodeData(item) {
    let v = item.value;
    if (/^CODE128/.test(item.format)) v = v.replace(/\\F/g, String.fromCharCode(207)); // \F → FNC1
    return v;
  }

  // 막대 두께/높이를 지정해서 바코드 하나를 그림 → { body, w, h } (단위: CSS px)
  function buildBarcode(barWidth, barHeight, item) {
    const pos = state.textPos;
    const native = pos === "top" || pos === "bottom";
    const fg = $("fg").value;
    const fontSize = num("bc-font-size", 20);
    const margin = num("bc-margin", 10);

    const tmp = document.createElementNS(SVG_NS, "svg");
    let valid = true;
    try {
      JsBarcode(tmp, barcodeData(item), {
        format: item.format,
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
    const label = item.value.replace(/\\F/g, "");
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

  function wrapSvg(body, w, h) {
    const bg = bgColor();
    return `<svg xmlns="${SVG_NS}" width="${r2(w)}" height="${r2(h)}" viewBox="0 0 ${r2(w)} ${r2(h)}">` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : "") + body + `</svg>`;
  }

  function renderBarcode() {
    $("qr-canvas").hidden = true;
    const list = barcodeItems().filter((it) => it.value);
    if (!list.length) return clearPreview();
    if (!window.JsBarcode) { clearPreview(); return showMsg("라이브러리를 불러오지 못했어요. 인터넷 연결을 확인하세요."); }

    const parts = [], bad = [];
    for (const it of list) {
      const r = buildBarcode(Math.max(1, num("bc-width", 2)), Math.max(1, num("bc-height", 100)), it);
      if (r) parts.push(r); else bad.push(it);
    }

    const multi = state.extra.length > 0;
    const badMsg = bad.length
      ? bad.map((b) => (multi ? `${b.n}번 ` : "") + `${b.format} 형식에 맞지 않는 데이터`).join(" · ")
      : "";
    if (!parts.length) { clearPreview(); return showMsg(badMsg); }

    // 위에서 아래로 쌓기 (가로는 가운데 정렬)
    const W = Math.max(...parts.map((p) => p.w));
    let y = 0, body = "";
    parts.forEach((p, i) => {
      if (i) y += STACK_GAP;
      body += `<g transform="translate(${r2((W - p.w) / 2)},${r2(y)})">${p.body}</g>`;
      y += p.h;
    });
    const H = y;

    const svg = wrapSvg(body, W, H);
    $("bc-holder").innerHTML = svg;

    current = { kind: "barcode", svg, pw: Math.round(W), ph: Math.round(H), viewW: W };
    $("dim").textContent = `${Math.round(W)} × ${Math.round(H)} px`;
    if (badMsg) showMsg(badMsg);
    setReady(true);
    applyFit();
  }

  // ---------- 바코드 추가 입력줄 ----------
  function renderExtraRows() {
    const box = $("bc-extra");
    box.innerHTML = "";
    state.extra.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "line extra-line";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = `바코드 데이터 입력 (${i + 2})`;
      inp.autocomplete = "off";
      inp.spellcheck = false;
      inp.value = it.value;
      inp.addEventListener("input", () => { it.value = inp.value; render(); });
      const sel = document.createElement("select");
      sel.setAttribute("aria-label", `바코드 종류 (${i + 2})`);
      FORMATS.forEach((f) => { const o = document.createElement("option"); o.value = o.textContent = f; sel.appendChild(o); });
      sel.value = it.format;
      sel.addEventListener("change", () => { it.format = sel.value; render(); });
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "rm";
      rm.textContent = "✕";
      rm.title = "이 바코드 삭제";
      rm.addEventListener("click", () => { state.extra.splice(i, 1); renderExtraRows(); render(); });
      row.append(inp, sel, rm);
      box.appendChild(row);
    });
    $("barcode-input").classList.toggle("multi", state.extra.length > 0);
    syncAddButton();
  }

  function syncAddButton() {
    const btn = $("add-bc");
    btn.hidden = state.mode !== "barcode" || state.extra.length >= MAX_BARCODES - 1;
    btn.title = `바코드 추가 (${state.extra.length + 1}/${MAX_BARCODES})`;
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

    const size = Math.max(50, Math.round(num("qr-size", 240)));
    const margin = Math.round(num("qr-margin", 2));
    const n = qr.getModuleCount();
    const total = n + margin * 2;
    const cell = Math.max(1, Math.floor(size / total));
    const off = Math.floor((size - cell * total) / 2) + margin * cell;
    const fg = $("fg").value, bg = bgColor();

    const canvas = $("qr-canvas");
    canvas.width = canvas.height = size;
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

    const svg = `<svg xmlns="${SVG_NS}" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
      (bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : "") + `<path d="${d}" fill="${fg}"/></svg>`;

    current = { kind: "qr", svg, pw: size, ph: size, viewW: size };
    $("dim").textContent = `${size} × ${size} px`;
    setReady(true);
    applyFit();
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
  ["bc-value", "fg", "bg", "bg-none", ...SELECTS].forEach((id) => $(id).addEventListener("input", render));

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
      document.querySelectorAll("#size-seg button").forEach((b) => b.classList.toggle("active", b === btn));
      Object.entries(PRESETS[btn.dataset.size]).forEach(([id, v]) => { $(id).value = v; showRange(id); });
      render();
    })
  );

  // + 버튼: 바코드 입력줄 추가 (최대 3개)
  $("add-bc").addEventListener("click", () => {
    if (state.extra.length >= MAX_BARCODES - 1) return;
    state.extra.push({ value: "", format: $("bc-format").value });
    renderExtraRows();
    render();
    const inputs = $("bc-extra").querySelectorAll("input");
    inputs[inputs.length - 1].focus();
  });

  $("fit").addEventListener("change", () => { applyFit(); save(); });
  window.addEventListener("resize", applyFit);

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
  if (Array.isArray(saved.extra))
    state.extra = saved.extra
      .filter((it) => it && typeof it.value === "string" && FORMATS.includes(it.format))
      .slice(0, MAX_BARCODES - 1);
  renderExtraRows();
  $("bg-none").checked = !!saved.bgNone;
  // 화면에 맞추기: 저장한 값이 없으면 휴대폰처럼 좁은 화면에서는 기본으로 켬
  $("fit").checked = typeof saved.fit === "boolean" ? saved.fit : window.innerWidth < 700;
  setTextPos(["top", "bottom", "left", "right", "none"].includes(saved.textPos) ? saved.textPos : "bottom");

  RANGES.forEach(showRange);
  const presetOf = Object.keys(PRESETS).find((k) => Object.entries(PRESETS[k]).every(([id, v]) => +$(id).value === v));
  document.querySelectorAll("#size-seg button").forEach((b) => b.classList.toggle("active", b.dataset.size === presetOf));

  // 검색어별 페이지의 기본값 (예: /ean13/ 페이지는 EAN13 선택)
  const pre = document.body.dataset;
  if (pre.presetFormat && FORMATS.includes(pre.presetFormat)) $("bc-format").value = pre.presetFormat;
  if (pre.presetQr && QR_TYPES[pre.presetQr]) $("qr-type").value = pre.presetQr;
  if (pre.presetPos) setTextPos(pre.presetPos);
  if (pre.presetBgnone === "1") $("bg-none").checked = true;
  // 이전에 입력한 값이 이 페이지의 바코드 종류에 맞지 않으면 비워 둠
  if (pre.presetFormat && window.JsBarcode && $("bc-value").value && !buildBarcode(2, 100, barcodeItems()[0])) $("bc-value").value = "";

  renderQrFields();
  setMode(pre.presetMode || (saved.mode === "qr" ? "qr" : "barcode"));
})();
