# LungFunctionReportViewer

폐기능 검사 결과 뷰어

## 로컬 실행

```bash
npm ci
npm run dev
```

## GitHub Pages 배포

`main` 브랜치에 push하면 GitHub Actions가 빌드 후 `gh-pages` 브랜치에 배포합니다.

### 최초 1회 설정 (필수)

1. [저장소 Pages 설정](https://github.com/SeongSikChae/LungFunctionReportViewer/settings/pages)으로 이동
2. **Build and deployment** → **Source**를 **Deploy from a branch**로 선택
3. **Branch**를 `gh-pages` / **/(root)** 로 선택 후 **Save**
4. **Actions** 탭에서 **Deploy to GitHub Pages** 워크플로가 완료될 때까지 대기 (1~2분)

> `gh-pages` 브랜치는 첫 배포 워크플로가 성공한 뒤에 생성됩니다.  
> 워크플로 실행 전에는 브랜치 목록에 `gh-pages`가 보이지 않을 수 있습니다.

### 접속 URL

배포가 완료되면 아래 주소에서 확인할 수 있습니다.

https://seongsikchae.github.io/LungFunctionReportViewer/

## 로컬 빌드 (GitHub Pages와 동일 설정)

```bash
BASE_PATH=/LungFunctionReportViewer/ npm run build
npm run preview
```
