# 바코드 · QR 코드 생성기

설치 없이 브라우저에서 바로 쓰는 무료 바코드 / QR 코드 생성기입니다.
서버 없이 HTML · CSS · JS 파일만으로 동작하는 **정적 웹사이트**라서 GitHub Pages에 무료로 올릴 수 있습니다.

## 기능

- **바코드** (기본 탭): CODE128(자동/A/B/C), EAN13, EAN8, UPC, CODE39, ITF14, ITF, codabar, MSI(10/11/1010/1110), pharmacode
  - CODE128 계열에서 `\F` 입력 시 GS1 FNC1 구분자 삽입
  - 너비 · 높이 · 여백 · 글자 크기 · 글자 간격 · 글꼴 조절
  - 글자 위치: 위 · 아래 · 좌측 · 우측 · 글자 없음
- **QR 코드**: TEXT/URL, WIFI, TEL, SMS, EMAIL (한글 지원), 크기 · 여백 · 오류 복원 수준
- 크기: 작게/보통/크게 + 상세 설정(너비·높이·여백 등)
- **바코드 추가** 버튼으로 한 장에 바코드 최대 3개
- 코드 색 · 배경 색 · **배경 없음(투명)**
- 저장: PNG / SVG, 클립보드 이미지 복사, 인쇄
- 입력값은 서버로 전송되지 않고, 새 탭·새 브라우저로 열면 빈 화면에서 시작

## 검색어별 페이지

검색 노출을 늘리기 위해 같은 도구를 검색어별 페이지로도 제공합니다. 페이지마다 제목·설명·안내 글이 다르고, 해당 바코드 종류가 미리 선택됩니다.

| 주소 | 대상 검색어 |
|---|---|
| `/` | 바코드 생성기, 바코드 만들기 |
| `/barcode-print/` | 바코드 출력, 바코드 인쇄, 바코드 라벨 |
| `/ean13/` | EAN13, 상품 바코드 만들기, 880 바코드 |
| `/code128/` | CODE128, 재고·물류·송장 바코드 |
| `/code39/` | CODE39, 자산관리 바코드 |
| `/itf14/` | ITF-14, 박스 바코드 |
| `/upc/` | UPC 바코드, 아마존 바코드 |
| `/barcode-image/` | 바코드 이미지, png, svg, 투명 바코드 |
| `/qr-code/` | QR코드 생성기, QR코드 만들기 |
| `/wifi-qr/` | 와이파이 QR코드 |

**페이지를 고치거나 추가하려면** `_build/build.py`의 `PAGES` 목록을 수정하고 `python3 _build/build.py`를 실행하세요.
도구 화면 자체를 고칠 때는 `_build/template.html`을 고친 뒤 같은 명령을 실행합니다. (각 폴더의 `index.html`을 직접 고치면 다음 실행 때 덮어써집니다.)

`_build/root/` 안의 `index.html`, `sitemap.xml`, `robots.txt`는 **websiteho.github.io 저장소**(주소 맨 앞)에 올리는 파일입니다.

## 파일 구성

```
index.html   화면 구조
style.css    디자인
app.js       동작 (바코드·QR 생성, 저장)
CREDITS.md   사용한 라이브러리 출처 · 라이선스 · 상표 표시
README.md    이 설명서
.nojekyll    GitHub Pages가 파일을 가공하지 않고 그대로 보여주게 하는 빈 파일 (지우지 마세요)
```

출처 및 라이선스는 [CREDITS.md](CREDITS.md)를 참고하세요.

---

## GitHub Pages로 무료 배포하기

### 방법 A — 웹 화면에서 끌어다 놓기 (프로그램 설치 없음, 추천)

1. **GitHub 가입 / 로그인**
   https://github.com 에서 계정을 만들고 로그인합니다.

2. **새 저장소(Repository) 만들기**
   - 오른쪽 위 **+** → **New repository**
   - Repository name: `barcode-qr-maker` (원하는 이름, 이 이름이 주소에 들어감)
   - **Public** 선택 (무료 계정은 Public이어야 Pages 사용 가능)
   - 나머지 체크박스는 건드리지 않고 **Create repository**

3. **파일 올리기**
   - 만들어진 저장소 화면에서 **uploading an existing file** 링크 클릭
     (또는 **Add file → Upload files**)
   - 압축을 푼 폴더 **안의 파일들**을 선택해서 끌어다 놓기
     `index.html`, `style.css`, `app.js`, `CREDITS.md`, `README.md`, `.nojekyll`
   - ⚠ 폴더째 올리면 주소가 한 단계 깊어집니다. 파일들을 직접 올리세요.
   - ⚠ `.nojekyll`은 숨김 파일이라 안 보일 수 있습니다.
     - Windows: 탐색기 **보기 → 숨긴 항목** 체크
     - Mac: Finder에서 `Cmd + Shift + .`
     - 못 올려도 동작에는 문제 없습니다.
   - 아래 **Commit changes** 클릭

4. **GitHub Pages 켜기**
   - 저장소 위쪽 메뉴 **Settings** → 왼쪽 메뉴 **Pages**
   - **Build and deployment → Source**: `Deploy from a branch`
   - **Branch**: `main` / `/(root)` 선택 → **Save**

5. **접속 확인**
   - 1~3분 기다린 뒤 Pages 화면을 새로고침하면 위쪽에
     `Your site is live at https://<내아이디>.github.io/barcode-qr-maker/` 가 나타납니다.
   - 저장소 **Actions** 탭에서 진행 상황(초록 체크 = 완료)을 볼 수 있습니다.

### 방법 B — git 명령어로 올리기

[Git](https://git-scm.com/downloads)이 설치되어 있어야 합니다. 이 폴더에는 이미 커밋 기록이 들어 있습니다.

```bash
cd barcode-qr-maker
git remote add origin https://github.com/<내아이디>/barcode-qr-maker.git
git branch -M main
git push -u origin main
```

- 처음 push할 때 로그인 창이 뜨거나, 비밀번호 대신 **Personal Access Token**을 요구할 수 있습니다.
  (GitHub → Settings → Developer settings → Personal access tokens에서 발급)
- 저장소를 만들 때 README를 같이 만들었다면 push가 거절됩니다. 그때는 빈 저장소로 다시 만들거나
  `git pull origin main --allow-unrelated-histories` 후 다시 push 하세요.
- push 후 방법 A의 **4~5단계**(Pages 켜기)를 똑같이 진행합니다.

---

## 수정 후 다시 올리기

- **웹 화면**: 저장소에서 **Add file → Upload files**로 바뀐 파일을 다시 올리면 같은 이름의 파일이 교체됩니다.
  또는 파일을 열고 ✏️(연필) 아이콘으로 직접 고친 뒤 **Commit changes**.
- **git**: `git add -A && git commit -m "수정 내용" && git push`
- 1~2분 뒤 자동으로 사이트에 반영됩니다. 안 바뀌어 보이면 `Ctrl + F5`(Mac: `Cmd + Shift + R`)로 강력 새로고침하세요.

## 자주 생기는 문제

| 증상 | 해결 |
|---|---|
| 404 페이지가 뜸 | 몇 분 더 기다리기 · Pages 설정에서 Branch가 `main` / `(root)`인지 확인 · `index.html`이 저장소 맨 위(폴더 안이 아님)에 있는지 확인 |
| 화면은 나오는데 바코드가 안 그려짐 | 인터넷 연결 확인 (라이브러리를 jsDelivr CDN에서 불러옴) · 회사망에서 CDN이 막혔을 수 있음 |
| 수정했는데 그대로임 | 강력 새로고침 · Actions 탭에서 배포가 끝났는지 확인 |
| 주소를 바꾸고 싶음 | Settings → General에서 저장소 이름 변경 → 주소도 함께 바뀜 |

## 로컬에서 실행

`index.html`을 더블클릭해서 브라우저로 열면 됩니다. (CDN 라이브러리를 쓰므로 인터넷 연결 필요)

## 라이선스

이 프로젝트에서 사용한 오픈소스의 출처와 라이선스 전문은 [CREDITS.md](CREDITS.md)에 있습니다.
