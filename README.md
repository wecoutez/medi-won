# 메디원내과의원 홈페이지 — 업로드 안내

## 1. 저장소에 이렇게 들어가야 합니다

압축을 푼 뒤, **폴더 자체가 아니라 그 안의 항목들**을 저장소 최상단에 올리세요.

```
저장소 최상단/
├── index.html          ← 한국어 홈  (medi-won.com)
├── CNAME               ← 도메인 연결 파일 (medi-won.com)
├── 404.html
├── care/index.html     → medi-won.com/care/
├── tour/index.html     → medi-won.com/tour/
├── … (exam, checkup, vaccine, health, diabetes, respiratory, endoscopy, about, location)
├── care.html           ← /care/ 로 넘겨주는 짧은 파일
├── en/
│   ├── index.html      ← 영문 홈  (medi-won.com/en/)
│   └── … (services, diagnostics, checkup, tour, doctor, visit)
└── images/             ← 사진 파일
```

**index.html 이 최상단에 있어야 한국어 홈이 첫 화면이 됩니다.**

zip 파일은 저장소에 올리지 마세요. GitHub은 압축을 풀지 않습니다.

## 2. 주소는 두 가지 다 열립니다

- `medi-won.com/care/` — 정식 주소
- `medi-won.com/care.html` — 위 주소로 자동 이동

## 3. 사진 추가하는 법

`images/` 폴더에 아래 이름으로 넣으면 코드 수정 없이 자동으로 들어갑니다.

| 파일명 | 들어가는 곳 | 권장 크기 |
|---|---|---|
| `reception.jpg` | 둘러보기 — 접수 데스크 | 1200 × 800 |
| `clinic.jpg` | 둘러보기 — 진료실 | 1200 × 800 |
| `exam.jpg` | 둘러보기 — 초음파 검사실 | 1200 × 800 |
| `endoscopy.jpg` | 둘러보기 — 내시경실 | 1200 × 800 |

로고, 원장 프로필, 약도, 대기실 사진은 HTML 안에 들어 있어 별도 파일이 필요 없습니다.

## 4. HTTPS 설정

1. Settings → Pages → Custom domain 이 `medi-won.com` 인지 확인
2. DNS A 레코드 네 개 확인 — 185.199.108.153 / 109.153 / 110.153 / 111.153
3. "Certificate provisioned" 표시가 뜰 때까지 대기
4. **Enforce HTTPS** 체크
