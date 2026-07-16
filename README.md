# LungFunctionReportViewer

폐기능 검사 결과 뷰어

## 로컬 실행

```bash
npm ci
npm run dev
```

## GitHub Pages 배포

이 저장소는 `main` 브랜치에 push되면 GitHub Actions로 자동 배포됩니다.

### 최초 1회 설정 (필수)

`deploy-pages` 단계에서 `404 Not Found`가 나면 **Pages가 아직 활성화되지 않은 상태**입니다. 아래 순서를 먼저 진행하세요.

1. [저장소 Pages 설정](https://github.com/SeongSikChae/LungFunctionReportViewer/settings/pages)으로 이동
2. **Build and deployment** → **Source**를 **Deploy from a branch**가 아닌 **GitHub Actions**로 변경
3. **Actions** 탭 → **Deploy to GitHub Pages** 워크플로 → **Re-run all jobs** (또는 `main`에 다시 push)

> 빌드(job `build`)는 성공하고 배포(job `deploy`)만 실패했다면, 위 1~2번 설정이 빠진 경우가 대부분입니다.

### 접속 URL

배포가 완료되면 아래 주소에서 확인할 수 있습니다.

https://seongsikchae.github.io/LungFunctionReportViewer/

## 로컬 빌드 (GitHub Pages와 동일 설정)

```bash
BASE_PATH=/LungFunctionReportViewer/ npm run build
npm run preview
```
