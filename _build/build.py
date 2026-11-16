#!/usr/bin/env python3
"""검색어별 페이지 생성기

사용법 (저장소 폴더에서):  python3 _build/build.py
- _build/template.html 을 바탕으로 각 페이지의 index.html 을 만듭니다.
- 루트 저장소(websiteho.github.io)에 올릴 sitemap.xml / robots.txt 는 _build/root/ 에 만듭니다.
도구 화면(입력칸·설정)을 고칠 때는 template.html 을 고친 뒤 이 스크립트를 다시 실행하세요.
"""
import json
import pathlib
from datetime import date

HOST = "https://websiteho.github.io"
SITE = HOST + "/barcode-qr-maker/"
ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = (ROOT / "_build" / "template.html").read_text(encoding="utf-8")

# ------------------------------------------------------------------
# 페이지 목록: slug("" = 메인), 제목, 설명, 검색어, 도구 기본값, 본문
# 본문은 페이지마다 다르게 써야 검색엔진이 '중복 페이지'로 보지 않습니다.
# ------------------------------------------------------------------
PAGES = [
    {
        "slug": "",
        "nav": "바코드 생성기",
        "h1": "바코드 생성기 · QR코드 생성기",
        "title": "무료 바코드 생성기 · 바코드 만들기 - 바코드·QR코드 무료 생성, 출력",
        "description": "회원가입·설치 없이 무료로 바코드를 생성하고 바로 출력하세요. CODE128, EAN-13, CODE39, ITF-14, QR코드 지원. 크기·색상 조절, 투명 배경, PNG·SVG 저장, 무료 인쇄.",
        "keywords": "무료 바코드 생성, 무료 바코드 생성기, 바코드 생성기, 바코드 만들기, 바코드 생성, 바코드 제작, 무료 바코드, 온라인 바코드, 바코드 프로그램, 바코드 무료, QR코드 생성기, QR코드 만들기",
        "preset": {},
        "about": """
      <h2>무료 바코드 생성 · 무료 바코드 출력</h2>
      <p>프로그램 설치나 회원가입 없이 바코드와 QR코드를 바로 만들 수 있는 무료 바코드 생성기입니다. 횟수 제한이나 워터마크도 없습니다.
        데이터를 입력하면 바코드가 바로 만들어지고, PNG·SVG 이미지로 저장하거나 그대로 출력할 수 있습니다.
        입력한 내용은 서버로 전송되지 않고 내 브라우저 안에서만 처리됩니다.</p>
      <h3>지원하는 바코드 종류</h3>
      <p>CODE128(A·B·C), EAN-13, EAN-8, UPC-A, CODE39, ITF-14, ITF, Codabar, MSI, Pharmacode</p>
      <h3>주요 기능</h3>
      <ul>
        <li>크기(작게·보통·크게)와 너비·높이·여백 세밀 조절</li>
        <li>한 장에 바코드 최대 3개까지 함께 만들기</li>
        <li>바코드 숫자 위치를 위·아래·왼쪽·오른쪽으로 선택</li>
        <li>투명 배경, 색상 변경, PNG · SVG 저장, 인쇄</li>
        <li>URL · 와이파이 · 전화 · 문자 · 이메일 QR코드 만들기 (한글 지원)</li>
      </ul>
      <details>
        <summary>바코드 만들기 프로그램을 설치해야 하나요?</summary>
        <p>아니요. 웹 브라우저만 있으면 PC와 휴대폰 어디서나 바로 바코드를 만들 수 있고, 생성·저장·인쇄 모두 무료입니다.</p>
      </details>
      <details>
        <summary>어떤 바코드 종류를 골라야 하나요?</summary>
        <p>판매용 상품에는 EAN-13, 사내 재고·물류 관리에는 CODE128, 택배 박스에는 ITF-14가 주로 쓰입니다.
          잘 모르겠다면 영문·숫자를 모두 넣을 수 있는 CODE128을 고르세요.</p>
      </details>""",
    },
    {
        "slug": "barcode-print",
        "nav": "바코드 출력 · 인쇄",
        "h1": "무료 바코드 출력 · 바코드 인쇄",
        "title": "무료 바코드 인쇄 · 바코드 출력 - 바코드 프린트, 라벨 인쇄",
        "description": "바코드를 만들어 무료로 바로 출력하세요. 한 장에 최대 3개, 확대해도 깨지지 않는 SVG 저장, 라벨지·스티커 바코드 인쇄까지 회원가입 없이 무료.",
        "keywords": "무료 바코드 인쇄, 무료 바코드 출력, 바코드 출력, 바코드 인쇄, 바코드 프린트, 바코드 출력 프로그램, 바코드 라벨 인쇄, 바코드 스티커, 바코드 라벨 만들기, 바코드 사이즈, 바코드 여러개 인쇄",
        "preset": {"mode": "barcode"},
        "about": """
      <h2>바코드를 원하는 크기로 출력하기</h2>
      <p>데이터를 넣고 <b>인쇄</b> 버튼을 누르면 바코드만 바로 출력됩니다. <b>바코드 추가</b> 버튼으로 한 장에 최대 3개까지 함께 인쇄할 수 있고,
        PNG·SVG로 저장해 라벨 프로그램이나 한글·워드 문서에 넣어 원하는 크기로 인쇄할 수도 있습니다.</p>
      <h3>바코드 인쇄 잘 되게 하는 방법</h3>
      <ul>
        <li><b>여백 남기기</b>: 바코드 양옆에 빈 공간(콰이어트 존)이 있어야 스캐너가 읽습니다. 여백을 0으로 두지 마세요.</li>
        <li><b>막대가 너무 가늘지 않게</b>: 막대 한 칸이 0.19mm보다 가늘면 일반 프린터에서 뭉개질 수 있습니다. 작게 인쇄할 때는 너비(막대 두께)를 늘려 보세요.</li>
        <li><b>진한 색 막대, 밝은 배경</b>: 검정 막대에 흰 배경이 가장 잘 읽힙니다. 빨간색 막대는 스캐너가 읽지 못하는 경우가 많습니다.</li>
        <li><b>SVG로 저장</b>하면 크기를 키워도 깨지지 않아 인쇄 품질이 가장 좋습니다.</li>
      </ul>
      <details>
        <summary>라벨지(스티커)에 바코드를 인쇄하려면?</summary>
        <p>바코드를 SVG(또는 PNG)로 저장한 뒤, 라벨지 제조사의 서식 프로그램이나 한글·워드 라벨 서식에 넣고 라벨 칸 크기에 맞춰 늘리거나 줄여 인쇄하세요. SVG는 크기를 바꿔도 깨지지 않습니다.</p>
      </details>
      <details>
        <summary>인쇄한 바코드가 스캔되지 않아요.</summary>
        <p>크기를 조금 키우거나, 여백을 늘리거나, 배경을 흰색으로 바꿔 보세요. 잉크 번짐이 있는 프린터라면 너비(막대 두께)를 늘리는 것이 도움이 됩니다.</p>
      </details>""",
    },
    {
        "slug": "ean13",
        "nav": "EAN-13 상품 바코드",
        "h1": "EAN-13 상품 바코드 만들기",
        "title": "EAN-13 바코드 생성기 - 상품 바코드 만들기 (880 국가코드)",
        "description": "EAN-13 상품 바코드를 무료로 만드세요. 숫자 12자리만 넣으면 체크 숫자 자동 계산. 880으로 시작하는 국내 상품 바코드 이미지 PNG·SVG 저장과 인쇄.",
        "keywords": "EAN13 바코드, EAN-13 생성, 상품 바코드 만들기, 상품 바코드 생성, 880 바코드, 바코드 체크숫자, 제품 바코드, 유통 바코드",
        "preset": {"mode": "barcode", "format": "EAN13"},
        "about": """
      <h2>EAN-13 바코드란?</h2>
      <p>EAN-13은 마트·편의점·온라인몰에서 판매되는 상품에 붙는 13자리 숫자 바코드입니다.
        한국에서 발급된 상품 바코드는 국가코드 <b>880</b>으로 시작합니다.</p>
      <h3>만드는 방법</h3>
      <ul>
        <li>종류가 EAN13으로 선택된 상태에서 숫자 12자리 또는 13자리를 입력하세요.</li>
        <li>12자리만 넣으면 13번째 체크 숫자는 자동으로 계산되어 붙습니다.</li>
        <li>표준 크기는 약 37.3 × 25.9 mm이며, 80%~200% 범위로 줄이거나 키워 쓸 수 있습니다.</li>
      </ul>
      <details>
        <summary>상품 바코드 번호는 어디서 받나요?</summary>
        <p>실제 판매용 상품 바코드 번호는 GS1 Korea(대한상공회의소 유통물류진흥원)에 회원 가입 후 발급받아야 합니다.
          임의로 만든 번호는 다른 상품과 겹칠 수 있어 유통 매장에서 사용할 수 없습니다. 발급받은 번호를 이 도구에 넣으면 바코드 이미지를 만들 수 있습니다.</p>
      </details>
      <details>
        <summary>EAN-13과 UPC는 무엇이 다른가요?</summary>
        <p>UPC-A는 미국·캐나다에서 쓰는 12자리 바코드이고, EAN-13은 그 밖의 대부분 국가에서 쓰는 13자리 바코드입니다.</p>
      </details>""",
    },
    {
        "slug": "code128",
        "nav": "CODE128 바코드",
        "h1": "CODE128 바코드 생성기",
        "title": "CODE128 바코드 생성기 - 재고·물류·송장 바코드 만들기",
        "description": "영문·숫자·기호를 모두 담는 CODE128 바코드를 무료로 생성하세요. 재고 관리, 물류, 송장, 사내 관리용 바코드 이미지 PNG·SVG 저장. GS1-128(FNC1) 지원.",
        "keywords": "CODE128 바코드, CODE128 생성, 코드128, 재고 바코드, 물류 바코드, 송장 바코드, 관리 바코드 만들기, GS1-128",
        "preset": {"mode": "barcode", "format": "CODE128"},
        "about": """
      <h2>CODE128 바코드란?</h2>
      <p>CODE128은 영문 대·소문자, 숫자, 기호를 모두 담을 수 있고 같은 길이에 많은 정보를 넣을 수 있는 바코드입니다.
        재고 관리, 물류, 택배 송장, 사원증·출입증처럼 회사 안에서 쓰는 바코드에 가장 많이 쓰입니다.</p>
      <h3>CODE128 A · B · C 차이</h3>
      <ul>
        <li><b>CODE128 (자동)</b>: 내용에 맞게 A·B·C를 자동으로 섞어 가장 짧게 만듭니다. 보통은 이걸 쓰면 됩니다.</li>
        <li><b>CODE128A</b>: 대문자와 숫자, 제어 문자</li>
        <li><b>CODE128B</b>: 대·소문자, 숫자, 기호</li>
        <li><b>CODE128C</b>: 숫자만, 두 자리씩 묶어 짧게 만듭니다 (짝수 자리)</li>
      </ul>
      <details>
        <summary>GS1-128 바코드도 만들 수 있나요?</summary>
        <p>네. 데이터 앞이나 항목 사이에 <code>\\F</code>를 입력하면 FNC1 구분자가 들어가 GS1-128 형식으로 만들 수 있습니다.</p>
      </details>""",
    },
    {
        "slug": "code39",
        "nav": "CODE39 바코드",
        "h1": "CODE39 바코드 생성기",
        "title": "CODE39 바코드 생성기 - 자산관리·산업용 바코드 무료 만들기",
        "description": "CODE39(코드39) 바코드를 무료로 만드세요. 대문자 영문과 숫자로 된 자산관리 번호, 장비·비품 라벨, 산업용 바코드 이미지 저장과 출력.",
        "keywords": "CODE39 바코드, 코드39, CODE39 생성, 자산관리 바코드, 비품 바코드, 장비 라벨 바코드, 산업용 바코드",
        "preset": {"mode": "barcode", "format": "CODE39"},
        "about": """
      <h2>CODE39 바코드란?</h2>
      <p>CODE39는 대문자 영문(A~Z), 숫자(0~9), 공백과 일부 기호(- . $ / + %)를 담을 수 있는 바코드입니다.
        구조가 단순해 오래된 스캐너에서도 잘 읽혀서 자산·비품 관리, 공장, 의료기관 등에서 널리 쓰입니다.</p>
      <h3>사용 팁</h3>
      <ul>
        <li>소문자는 쓸 수 없습니다. 대문자로 입력하세요.</li>
        <li>CODE128보다 바코드 길이가 길어지므로, 내용이 길면 가로 크기를 넉넉히 잡으세요.</li>
        <li>비품 라벨이라면 SVG로 저장해 라벨 서식에 넣고 크기를 맞춰 인쇄하세요.</li>
      </ul>""",
    },
    {
        "slug": "itf14",
        "nav": "ITF-14 박스 바코드",
        "h1": "ITF-14 박스 바코드 만들기",
        "title": "ITF-14 바코드 생성기 - 박스·물류 단위 바코드 만들기",
        "description": "택배 박스와 물류 단위에 쓰는 ITF-14 바코드를 무료로 만드세요. 14자리 숫자 입력만으로 박스 바코드 이미지 생성, 인쇄용 PNG·SVG 저장.",
        "keywords": "ITF14 바코드, ITF-14 생성, 박스 바코드, 물류 바코드, 박스 바코드 만들기, 외박스 바코드, GTIN-14",
        "preset": {"mode": "barcode", "format": "ITF14"},
        "about": """
      <h2>ITF-14 바코드란?</h2>
      <p>ITF-14는 낱개 상품이 여러 개 들어 있는 박스(물류 단위)에 붙이는 14자리 숫자 바코드입니다.
        골판지 박스처럼 인쇄 품질이 낮은 곳에서도 잘 읽히도록 막대가 굵은 것이 특징입니다.</p>
      <h3>만드는 방법</h3>
      <ul>
        <li>숫자 13자리 또는 14자리를 입력하세요. 13자리만 넣으면 체크 숫자가 자동으로 붙습니다.</li>
        <li>박스에 직접 인쇄하거나 라벨로 붙일 때는 크기를 넉넉히(가로 100mm 이상 권장) 잡으세요.</li>
      </ul>
      <details>
        <summary>낱개 상품 바코드(EAN-13)와 무엇이 다른가요?</summary>
        <p>EAN-13은 매장 계산대에서 찍는 낱개 상품용이고, ITF-14는 창고·물류센터에서 박스 단위로 입출고를 관리할 때 씁니다.</p>
      </details>""",
    },
    {
        "slug": "upc",
        "nav": "UPC 바코드",
        "h1": "UPC 바코드 생성기",
        "title": "UPC 바코드 생성기 - UPC-A 바코드 만들기 (미국 수출·아마존)",
        "description": "UPC-A 바코드를 무료로 만드세요. 미국·캐나다 수출 상품, 아마존 판매용 12자리 UPC 바코드 이미지 PNG·SVG 저장과 인쇄.",
        "keywords": "UPC 바코드, UPC-A 생성, UPC 바코드 만들기, 아마존 바코드, 미국 수출 바코드, 12자리 바코드",
        "preset": {"mode": "barcode", "format": "UPC"},
        "about": """
      <h2>UPC 바코드란?</h2>
      <p>UPC-A는 미국과 캐나다에서 주로 쓰는 12자리 숫자 상품 바코드입니다.
        미국으로 수출하거나 해외 온라인몰에 상품을 등록할 때 UPC를 요구하는 경우가 있습니다.</p>
      <h3>만드는 방법</h3>
      <ul>
        <li>숫자 11자리 또는 12자리를 입력하세요. 11자리만 넣으면 체크 숫자가 자동으로 붙습니다.</li>
        <li>정식 UPC 번호는 GS1 US 등 GS1 기관에서 발급받은 번호를 사용해야 합니다.</li>
      </ul>""",
    },
    {
        "slug": "barcode-image",
        "nav": "바코드 이미지 저장",
        "h1": "바코드 이미지 만들기 (PNG · SVG)",
        "title": "바코드 이미지 만들기 - 바코드 PNG·SVG 무료 다운로드",
        "description": "바코드를 이미지 파일로 저장하세요. 투명 배경 PNG, 확대해도 깨지지 않는 SVG 벡터, 색상 변경까지. 디자인·포장지·상세페이지용 바코드 이미지 무료 생성.",
        "keywords": "바코드 이미지, 바코드 png, 바코드 svg, 투명 바코드, 바코드 다운로드, 바코드 벡터, 바코드 그림, 바코드 일러스트",
        "preset": {"mode": "barcode"},
        "about": """
      <h2>바코드를 이미지 파일로 저장하기</h2>
      <p>만든 바코드는 <b>PNG 저장</b>, <b>SVG 저장</b>, <b>이미지 복사</b> 버튼으로 바로 내려받거나 붙여넣을 수 있습니다.</p>
      <h3>어떤 형식을 써야 하나요?</h3>
      <ul>
        <li><b>PNG</b>: 문서, 엑셀, 메신저, 쇼핑몰 상세페이지에 넣기 좋습니다. 인쇄용이라면 크기를 "크게"로 두고 저장하세요.</li>
        <li><b>SVG</b>: 일러스트레이터·피그마 같은 디자인 프로그램용 벡터 파일입니다. 아무리 키워도 깨지지 않아 포장지·인쇄물 디자인에 적합합니다.</li>
        <li><b>투명 배경</b>: 설정에서 '배경 없음'을 체크하면 배경이 투명한 바코드가 저장되어 색이 있는 디자인 위에 올릴 수 있습니다.</li>
      </ul>
      <details>
        <summary>바코드 색을 바꿔도 되나요?</summary>
        <p>바꿀 수 있지만 막대는 진한 색, 배경은 밝은 색이어야 스캔이 잘 됩니다. 빨간색·주황색 막대는 스캐너가 읽지 못하는 경우가 많으니 피하세요.</p>
      </details>""",
    },
    {
        "slug": "transparent-barcode",
        "nav": "투명 바코드",
        "h1": "투명 바코드 생성 · 배경 없는 바코드",
        "title": "투명 바코드 생성 - 배경 없는 바코드 PNG·SVG 무료 만들기",
        "description": "배경이 투명한 바코드를 무료로 만드세요. 배경 없는 바코드 PNG·SVG를 내려받아 포장지·라벨·상세페이지 디자인 위에 바로 올릴 수 있습니다.",
        "keywords": "투명 바코드, 투명 바코드 생성, 배경 없는 바코드, 배경 투명 바코드, 바코드 배경 제거, 투명 바코드 png, 바코드 png 투명, 누끼 바코드",
        "preset": {"mode": "barcode", "bgnone": "1"},
        "about": """
      <h2>배경 없는 투명 바코드 만들기</h2>
      <p>이 페이지는 <b>배경 없음</b>이 미리 켜져 있어서, 데이터만 넣으면 흰 배경이 없는 투명 바코드가 만들어집니다.
        PNG로 저장하면 투명 배경 이미지, SVG로 저장하면 배경 없는 벡터 파일이 됩니다.</p>
      <h3>투명 바코드가 필요한 경우</h3>
      <ul>
        <li>색이 있는 포장지·박스 디자인 위에 바코드를 올릴 때</li>
        <li>쇼핑몰 상세페이지나 카탈로그 이미지에 자연스럽게 넣을 때</li>
        <li>포토샵·일러스트레이터에서 따로 배경을 지우는(누끼) 작업 없이 바로 쓰고 싶을 때</li>
      </ul>
      <details>
        <summary>투명 바코드도 스캔이 잘 되나요?</summary>
        <p>바코드가 놓이는 바탕이 밝은 색이면 잘 읽힙니다. 어두운 바탕 위에 올리면 스캐너가 막대를 구분하지 못하니,
          그럴 때는 '배경 없음'을 끄고 흰 배경을 남겨 두세요.</p>
      </details>
      <details>
        <summary>막대 색도 바꿀 수 있나요?</summary>
        <p>설정의 '코드 색'에서 바꿀 수 있습니다. 검정·남색처럼 진한 색을 쓰고, 빨간색·주황색은 피하세요.</p>
      </details>""",
    },
    {
        "slug": "qr-code",
        "nav": "QR코드 생성기",
        "h1": "QR코드 생성기 · QR코드 만들기",
        "title": "무료 QR코드 생성기 - QR코드 만들기 (URL·링크·텍스트), 무료 QR 인쇄",
        "description": "링크나 글자를 넣으면 QR코드가 바로 만들어집니다. 무료·무제한, 회원가입 없이 QR코드 생성, 크기·색상 변경, PNG·SVG 저장과 인쇄.",
        "keywords": "무료 QR코드 생성, 무료 QR코드 만들기, QR코드 생성기, QR코드 만들기, 큐알코드 만들기, QR코드 생성, 링크 QR코드, URL QR코드, 무료 QR코드, 큐알 만들기",
        "preset": {"mode": "qr", "qr": "text"},
        "about": """
      <h2>무료 QR코드 생성기</h2>
      <p>홈페이지 주소, 설문 링크, 메뉴판, 안내 문구 등 원하는 내용을 넣으면 QR코드가 바로 만들어집니다.
        만든 QR코드는 기간 제한 없이 계속 쓸 수 있습니다. 내용이 QR코드 안에 직접 담기기 때문에 이 사이트가 없어져도 동작합니다.</p>
      <h3>만들 수 있는 QR코드</h3>
      <ul>
        <li><b>TEXT/URL</b>: 링크·글자 (한글 지원)</li>
        <li><b>WIFI</b>: 찍으면 와이파이에 바로 연결</li>
        <li><b>TEL · SMS</b>: 찍으면 전화 걸기 · 문자 보내기</li>
        <li><b>EMAIL</b>: 받는 사람·제목·내용이 채워진 메일 쓰기</li>
      </ul>
      <details>
        <summary>QR코드 크기는 어느 정도가 좋나요?</summary>
        <p>가까이서 찍는 명함·전단지는 가로 2cm 이상, 멀리서 찍는 포스터는 더 크게 만드세요.
          인쇄용으로는 크기를 바꿔도 깨지지 않는 SVG 저장을 권장합니다.</p>
      </details>""",
    },
    {
        "slug": "qr-print",
        "nav": "QR코드 인쇄",
        "h1": "무료 QR코드 인쇄 · QR코드 출력",
        "title": "무료 QR 인쇄 - QR코드 출력, QR코드 프린트",
        "description": "QR코드를 만들어 무료로 바로 인쇄하세요. 명함·전단지·포스터·테이블 안내용 QR코드 출력, PNG·SVG 저장, 회원가입 없음.",
        "keywords": "무료 QR 인쇄, 무료 QR코드 인쇄, QR코드 출력, QR코드 인쇄, QR 인쇄, QR코드 프린트, QR코드 크기, 명함 QR코드, 전단지 QR코드",
        "preset": {"mode": "qr", "qr": "text"},
        "about": """
      <h2>QR코드를 원하는 크기로 인쇄하기</h2>
      <p>링크나 글자를 넣고 <b>인쇄</b> 버튼을 누르면 QR코드만 바로 출력됩니다. 크기는 설정에서 조절하고,
        SVG로 저장하면 명함·전단지·포스터 디자인에 넣어 원하는 크기로 늘려도 깨지지 않습니다. 모두 무료입니다.</p>
      <h3>용도별 권장 크기</h3>
      <ul>
        <li><b>명함</b>: 가로 15~20mm 이상</li>
        <li><b>전단지·메뉴판·테이블 안내</b>: 25~40mm</li>
        <li><b>벽 포스터·현수막</b>: 찍는 거리(cm)의 1/10 이상 (예: 1m 거리 → 10cm)</li>
      </ul>
      <h3>인쇄 품질 팁</h3>
      <ul>
        <li>QR코드 둘레의 여백(흰 테두리)을 지우지 마세요. 여백이 없으면 인식이 잘 안 됩니다.</li>
        <li>내용이 길수록 칸이 촘촘해지므로 크기를 키우세요.</li>
        <li>로고를 덮거나 일부가 가려질 수 있는 곳에는 '오류 복원 수준'을 높음 이상으로 올리세요.</li>
      </ul>""",
    },
    {
        "slug": "wifi-qr",
        "nav": "와이파이 QR코드",
        "h1": "와이파이 QR코드 만들기",
        "title": "와이파이 QR코드 만들기 - 찍으면 바로 연결되는 WiFi QR코드",
        "description": "와이파이 이름과 비밀번호만 넣으면 찍기만 해도 연결되는 WiFi QR코드가 만들어집니다. 매장·카페·사무실 와이파이 안내용 무료 QR코드 생성.",
        "keywords": "와이파이 QR코드, WiFi QR코드, 와이파이 큐알, 와이파이 QR코드 만들기, 와이파이 비밀번호 QR, 카페 와이파이 QR",
        "preset": {"mode": "qr", "qr": "wifi"},
        "about": """
      <h2>와이파이 QR코드란?</h2>
      <p>휴대폰 카메라로 찍기만 하면 비밀번호를 입력하지 않아도 와이파이에 바로 연결되는 QR코드입니다.
        카페·식당·사무실·숙소에서 손님에게 와이파이를 안내할 때 편리합니다.</p>
      <h3>만드는 방법</h3>
      <ul>
        <li>와이파이 이름(SSID)과 비밀번호를 입력하세요. 대·소문자까지 정확히 넣어야 합니다.</li>
        <li>비밀번호가 없는 공개 와이파이라면 비밀번호 칸을 비워 두세요.</li>
        <li>아이폰·안드로이드 기본 카메라로 모두 인식됩니다.</li>
      </ul>
      <details>
        <summary>입력한 비밀번호가 어딘가에 저장되나요?</summary>
        <p>아니요. QR코드는 내 브라우저 안에서만 만들어지고 서버로 전송되지 않습니다. 저장 파일 이름에도 비밀번호는 들어가지 않습니다.</p>
      </details>""",
    },
]

# ------------------------------------------------------------------
def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def build():
    out = []
    for p in PAGES:
        url = SITE + (p["slug"] + "/" if p["slug"] else "")
        base = "../" if p["slug"] else ""
        jsonld = json.dumps({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": p["h1"],
            "url": url,
            "description": p["description"],
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Any",
            "inLanguage": "ko",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "KRW"},
        }, ensure_ascii=False, indent=2)
        related = "\n".join(
            f'          <li><a href="{base}{q["slug"] + "/" if q["slug"] else ""}"{" aria-current=\"page\"" if q is p else ""}>{q["nav"]}</a></li>'
            for q in PAGES
        )
        pre = p["preset"]
        html = TEMPLATE
        for k, v in {
            "title": esc(p["title"]), "description": esc(p["description"]), "keywords": esc(p["keywords"]),
            "url": url, "base": base, "h1": p["h1"], "jsonld": jsonld, "about": p["about"].strip("\n"),
            "related": related,
            "p_mode": pre.get("mode", ""), "p_format": pre.get("format", ""),
            "p_qr": pre.get("qr", ""), "p_pos": pre.get("pos", ""), "p_bgnone": pre.get("bgnone", ""),
        }.items():
            html = html.replace("{{" + k + "}}", v)
        assert "{{" not in html, p["slug"]
        dest = ROOT / p["slug"] / "index.html" if p["slug"] else ROOT / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding="utf-8")
        out.append(url)

    # 루트 저장소(websiteho.github.io)용 파일
    rootdir = ROOT / "_build" / "root"
    rootdir.mkdir(exist_ok=True)
    today = date.today().isoformat()
    urls = "\n".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in out)
    root_urls = f"  <url><loc>{HOST}/</loc><lastmod>{today}</lastmod></url>\n" + urls
    (rootdir / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + root_urls + "\n</urlset>\n",
        encoding="utf-8")
    # barcode-qr-maker 속성용 사이트맵 (홈 주소 제외)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n",
        encoding="utf-8")
    (rootdir / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {HOST}/sitemap.xml\n", encoding="utf-8")
    print("\n".join(out))


if __name__ == "__main__":
    build()
