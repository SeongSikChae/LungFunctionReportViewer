# LungFunctionReportViewer

폐기능 검사 결과 뷰어

## 로컬 실행

```bash
npm ci
npm run dev
```

## GitHub Pages 배포

이 저장소는 `main` 브랜치에 push되면 GitHub Actions로 자동 배포됩니다.

### 최초 1회 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → **Source**를 **GitHub Actions**로 선택
3. `main` 브랜치에 변경 사항을 push하면 Actions가 빌드·배포를 실행합니다

### 접속 URL

배포가 완료되면 아래 주소에서 확인할 수 있습니다.

https://seongsikchae.github.io/LungFunctionReportViewer/

## 로컬 빌드 (GitHub Pages와 동일 설정)

```bash
BASE_PATH=/LungFunctionReportViewer/ npm run build
npm run preview
```
