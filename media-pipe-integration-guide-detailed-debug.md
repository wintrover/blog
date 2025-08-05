# MediaPipe Face Landmarker 통합 상세 디버깅 가이드

## 1. 개요
이 문서는 MediaPipe Face Landmarker를 웹캠 스트림에 통합하는 과정에서 발생했던 다양한 문제점, 각 문제에 대한 디버깅 접근 방식, 핵심 단서, 그리고 해결 과정을 상세하게 기록합니다. 특히 CDN/CSP 충돌, 파일 로딩 문제, 랜드마크 렌더링 오류 등 실제 개발 과정에서 마주칠 수 있는 복합적인 문제들을 다룹니다.

## 2. 초기 서버 실행 및 접속 문제

### 2.1. 문제 상황: `npm run dev` 실행 시 `ENOENT` 오류
서버를 처음 실행하려고 `npm run dev` 명령어를 사용했을 때, `Could not read package.json: Error: ENOENT: no such file or directory` 오류가 발생했습니다.

**핵심 단서:**
*   `ENOENT: no such file or directory`: 파일이나 디렉토리를 찾을 수 없다는 시스템 오류 코드.
*   `package.json` 파일을 찾을 수 없다는 명시적인 메시지.
*   오류 메시지에 표시된 경로가 현재 터미널의 작업 디렉토리(`D:\Coding\feature_KYC`)이며, `package.json`은 실제로는 `D:\Coding\feature_KYC\web_prototype` 내부에 존재한다는 사실.

**추론 과정 및 해결 방향:**
`package.json` 파일이 없다는 것은 `npm` 명령어가 현재 디렉토리가 아닌 다른 곳에서 실행되었거나, `package.json`이 예상 경로에 없다는 의미입니다. 프로젝트 구조를 확인했을 때, `package.json`은 `web_prototype` 하위 디렉토리에 있었습니다. 따라서 `npm run dev` 명령어를 실행하기 전에 `web_prototype` 디렉토리로 이동해야 한다고 추론했습니다.

**해결:**
터미널에서 `cd web_prototype` 명령어를 먼저 실행한 후, `npm run dev`를 실행했습니다.

```bash
cd web_prototype
npm run dev
```

### 2.2. 문제 상황: `&&` 연산자 오류 (PowerShell 환경)
이후 서버 재시작 등의 작업을 위해 `cd web_prototype && npm run dev`와 같이 명령어를 연결했을 때, PowerShell 환경에서 `The token '&&' is not a valid statement separator in this version.` 오류가 발생했습니다.

**핵심 단서:**
*   `&&` 연산자가 유효하지 않다는 명시적인 오류 메시지.
*   PowerShell이라는 특정 쉘 환경에서 발생.

**추론 과정 및 해결 방향:**
`&&` 연산자는 Bash 쉘에서 명령어를 순차적으로 실행할 때 사용되는 표준 문법입니다. 하지만 PowerShell에서는 이 역할을 `;` (세미콜론)이 수행한다는 것을 알고 있었습니다. 따라서 쉘 환경에 맞는 명령어 구분자를 사용해야 한다고 추론했습니다.

**해결:**
`&&` 대신 `;`를 사용하여 명령어를 연결했습니다.

```bash
cd web_prototype; npm run dev
```

## 3. MediaPipe 라이브러리 로딩 및 CSP 문제

### 3.1. 문제 상황: CDN WASM 파일 404 및 MIME 타입 오류
브라우저 콘솔에서 `GET https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@.../vision_wasm_internal.js net::ERR_ABORTED 404 (Not Found)` 및 `Refused to execute script ... because its MIME type ('text/plain') is not executable` 오류가 발생했습니다.

**핵심 단서:**
*   `404 (Not Found)`: 요청한 리소스(WASM JS 파일)를 서버에서 찾을 수 없다는 의미. CDN에서 제공되지 않거나, 경로가 잘못되었을 가능성.
*   `Refused to execute script ... because its MIME type ('text/plain') is not executable`: 스크립트가 실행되지 않는다는 보안 오류. 서버가 스크립트를 `text/plain`으로 잘못 전달했거나, CSP(Content Security Policy)가 해당 소스를 차단하고 있다는 의미.

**추론 과정 및 해결 방향:**
MediaPipe 라이브러리가 복잡한 WASM 파일을 내부적으로 로드한다는 것을 알고 있었습니다. `404` 오류는 CDN이 모든 WASM 관련 파일을 직접 제공하지 않거나, 버전 간의 경로 불일치 때문일 수 있다고 판단했습니다. `MIME type` 오류는 서버의 `Content-Security-Policy` 헤더와 관련이 있다고 추론했습니다. 웹 프로토타입 서버가 `helmet` 미들웨어를 사용하여 CSP를 설정하고 있었으므로, 이 설정이 CDN에서 로드되는 MediaPipe 리소스를 차단하고 있을 것이라고 예상했습니다.

**해결:**
1.  **CSP 업데이트 (`web_prototype/server.js`):** `helmet` 미들웨어의 `contentSecurityPolicy` 내 `scriptSrc`, `connectSrc`, `workerSrc` 디렉티브에 `https://cdn.jsdelivr.net`을 추가하여 MediaPipe CDN 도메인을 명시적으로 허용했습니다.
2.  **WASM 및 모델 파일 로컬 처리:** 안정적인 로딩을 위해 MediaPipe의 `.task` 모델 파일(`face_landmarker.task`)과 필요한 WASM 파일(`vision_wasm_internal.js`, `vision_wasm_internal.wasm` 등)을 수동으로 다운로드하여 프로젝트 내 로컬 경로(`web_prototype/models/onnx/` 및 `web_prototype/public/js/wasm/`)에 배치했습니다.
3.  **서버 정적 파일 제공 설정 (`web_prototype/server.js`):** Express.js 서버가 이 로컬 경로들을 정적 파일로 올바르게 제공하도록 `app.use(express.static(...))` 미들웨어를 추가했습니다.
4.  **`face-detection.js`에서 로컬 경로 사용:** `FilesetResolver.forVisionTasks`와 `modelAssetPath`의 경로를 CDN URL 대신 로컬에서 접근 가능한 `/js/wasm` 및 `/models/onnx/face_landmarker.task`로 변경했습니다.

## 4. JavaScript 모듈 로딩 및 전역 변수 문제

### 4.1. 문제 상황: `ReferenceError: LandmarkRenderer is not defined`
MediaPipe 초기화 성공 후, 랜드마크를 그리는 부분에서 `LandmarkRenderer is not defined` 오류가 발생했습니다.

**핵심 단서:**
*   `ReferenceError: ... is not defined`: 특정 변수나 클래스를 찾을 수 없다는 JavaScript 오류. 이는 해당 변수가 선언되지 않았거나, 접근 범위(스코프) 내에 없다는 의미입니다.
*   `LandmarkRenderer` 클래스는 `face-detection.js`에서 사용되고 있었음.

**추론 과정 및 해결 방향:**
`LandmarkRenderer` 클래스는 별도의 파일(`landmark-renderer.js`)에 정의되어 있었습니다. `face-detection.js`에서 이 클래스를 사용하려면 명시적으로 `import`해야 하는데, 이 부분이 누락되었을 것이라고 추론했습니다.

**해결:**
`web_prototype/src/client/js/core/face-detection.js` 파일 상단에 `import { LandmarkRenderer } from './landmark-renderer.js';` 구문을 추가하여 `LandmarkRenderer` 클래스를 가져왔습니다.

### 4.2. 문제 상황: `ReferenceError: FilesetResolver is not defined`
이전 문제 해결을 위해 `web_prototype/public/index.html`에서 MediaPipe CDN 스크립트 블록을 제거한 후, `FilesetResolver is not defined` 오류가 발생했습니다.

**핵심 단서:**
*   `FilesetResolver is not defined`: `LandmarkRenderer`와 유사하게, `FilesetResolver`가 정의되지 않았다는 오류.
*   이전에 CDN에서 로드되던 스크립트가 제거된 직후 발생.

**추론 과정 및 해결 방향:**
MediaPipe 라이브러리(특히 `FilesetResolver`와 `FaceLandmarker`)는 `vision_bundle.mjs` 파일을 통해 전역적으로 노출되도록 설계된 부분이 있었습니다. `index.html`에서 해당 CDN 스크립트를 제거하면서 이 전역 변수들이 사라졌고, `face-detection.js`가 이를 전역 변수로 기대하고 사용하고 있었기 때문에 오류가 발생했다고 추론했습니다. `face-detection.js` 내부에서 직접 `import`하는 방식으로 변경하는 것이 이상적이지만, 기존 코드 구조상 전역 변수 의존성을 빠르게 해결하는 것이 우선이라고 판단했습니다.

**해결:**
`web_prototype/public/index.html` 파일에 MediaPipe CDN 스크립트 블록을 다시 추가하여 `FaceLandmarker`와 `FilesetResolver`를 `window` 객체를 통해 전역적으로 노출되도록 했습니다.

```html
<!-- web_prototype/public/index.html -->
<script type="module">
    import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/vision_bundle.mjs';
    window.FaceLandmarker = FaceLandmarker;
    window.FilesetResolver = FilesetResolver;
    console.log('✅ MediaPipe Tasks 라이브러리 로드 완료');
</script>
```

### 4.3. 문제 상황: `vision_bundle.mjs` 404 (잘못된 로컬 임포트 경로)
`face-detection.js`에서 `import '../js/wasm/vision_bundle.mjs'`와 같이 로컬 경로로 `vision_bundle.mjs`를 임포트하려고 시도했을 때, `GET http://localhost:3000/src/client/js/js/wasm/vision_bundle.mjs net::ERR_ABORTED 404 (Not Found)` 오류가 발생했습니다.

**핵심 단서:**
*   `404 (Not Found)`: 파일 경로가 잘못되었음을 의미.
*   요청 URL이 `/src/client/js/js/wasm/`으로 중복된 `js` 디렉토리를 포함하고 있음.

**추론 과정 및 해결 방향:**
`face-detection.js` 파일의 위치(`web_prototype/src/client/js/core/`)를 기준으로 상대 경로를 계산할 때, `../js/wasm/`가 예상과 다르게 해석된 것이라고 추론했습니다. 웹 루트 기준으로 절대 경로를 사용하면 이러한 상대 경로 해석 오류를 피할 수 있습니다. 또한, 실제 `public/js/wasm/` 디렉토리에는 `vision_bundle.mjs` 파일 자체가 존재하지 않고, `vision_wasm_internal.js`, `vision_wasm_internal.wasm` 같은 개별 파일들만 있다는 것을 확인했습니다.

**해결:**
1.  **절대 경로 사용:** `face-detection.js`에서 `vision_bundle.mjs`에 대한 직접적인 `import` 문을 제거하고, `index.html`을 통해 전역적으로 노출되는 `FaceLandmarker`와 `FilesetResolver`를 계속 사용하도록 했습니다.
2.  **`FilesetResolver.forVisionTasks` 경로 수정:** `FilesetResolver.forVisionTasks`에는 WASM 파일들이 있는 디렉토리 경로만 (`/js/wasm`) 전달하면 내부적으로 필요한 파일들을 로드합니다.

## 5. 랜드마크 데이터 처리 및 렌더링 문제

### 5.1. 문제 상황: 랜드마크가 그려지지 않거나 `undefined` 오류
MediaPipe 초기화 및 감지 자체는 성공했지만, 랜드마크가 캔버스에 그려지지 않았습니다. 콘솔 로그를 확인했을 때, `LandmarkRenderer: 랜드마크 데이터 수: undefined` 또는 `LandmarkRenderer: 첫 번째 랜드마크 좌표: undefined undefined`와 같은 메시지가 반복되었습니다.

**핵심 단서:**
*   `face-detection.js`의 `onMediaPipeResults`에서 `console.log('랜드마크 렌더러에 랜드마크 전달 중.', results.landmarks[0].length);`를 통해 `results.landmarks[0].length`는 468로 올바른 값을 보여줌.
*   `landmark-renderer.js`의 `renderLandmarks` 내부에서 `this.landmarks.length`가 `1`이거나 `undefined`로 표시됨.
*   `results.landmarks`의 구조가 `Array(1)` 안에 또 다른 `Array(468)`가 중첩된 형태 `[[{x,y,z}, ... (468개)]]`라는 것을 `console.log(results.landmarks)`로 확인.

**추론 과정 및 해결 방향:**
`face-detection.js`에서는 `results.landmarks[0]`가 468개의 랜드마크를 담고 있는 배열임을 확인했습니다. 하지만 이 배열을 `landmark-renderer.js`의 `renderLandmarks(landmarks)` 함수로 전달했을 때, `landmark-renderer.js` 내부에서 `this.landmarks = landmarks[0];`와 같이 다시 `landmarks[0]`에 접근하고 있었습니다. 이는 `landmarks`가 이미 `Array(468)`인데, 그 첫 번째 요소인 `landmarks[0]`는 랜드마크 객체가 아닌 첫 번째 랜드마크 객체 자체를 가리키게 되어 `landmarks[0].x`와 같은 접근이 `undefined`가 되는 원인이었습니다. 즉, `results.landmarks`는 `[[...랜드마크 데이터...]]` 형태였고, 여기서 `results.landmarks[0]`를 `landmark-renderer.js`로 넘겨주면 `landmark-renderer.js` 내부에서 `landmarks`는 `[...랜드마크 데이터...]`가 되는데, 이때 다시 `landmarks[0]`에 접근하면 첫 번째 랜드마크 객체가 되는 것입니다. 렌더러는 전체 랜드마크 배열을 기대하고 있었으므로 `this.landmarks = landmarks;`로 수정해야 했습니다.

**해결:**
1.  **`landmark-renderer.js`의 `renderLandmarks` 수정:** `this.landmarks = landmarks[0];`를 `this.landmarks = landmarks;`로 변경했습니다. 이제 `renderLandmarks`는 랜드마크 배열을 직접 받습니다.
2.  **`face-detection.js`의 `onMediaPipeResults` 수정:** `this.landmarkRenderer.renderLandmarks(results.landmarks);`를 `this.landmarkRenderer.renderLandmarks(results.landmarks[0]);`로 변경했습니다. MediaPipe가 반환하는 `results.landmarks`는 얼굴 수에 따라 배열 안에 배열을 포함하므로, 첫 번째 얼굴의 랜드마크 배열인 `results.landmarks[0]`를 `LandmarkRenderer`에 전달해야 했습니다.

### 5.2. 문제 상황: 랜드마크가 보이는데 너무 작거나 위치가 이상함
랜드마크가 이제 그려지기 시작했지만, 캔버스에 너무 작게 표시되거나 예상과 다른 위치에 나타났습니다.

**핵심 단서:**
*   MediaPipe의 랜드마크 좌표는 일반적으로 정규화된 좌표(0.0에서 1.0 사이의 값)로 제공된다는 지식.
*   캔버스의 크기(픽셀 단위)와 랜드마크 좌표(정규화된 단위) 간의 불일치.

**추론 과정 및 해결 방향:**
MediaPipe는 랜드마크 좌표를 비디오 프레임의 너비와 높이에 대한 비율로 정규화하여 반환합니다. 하지만 HTML 캔버스에 그림을 그릴 때는 픽셀 단위를 사용해야 합니다. 랜드마크 좌표에 캔버스의 실제 너비와 높이를 곱하여 픽셀 좌표로 변환해야 한다고 추론했습니다.

**해결:**
`web_prototype/src/client/js/core/landmark-renderer.js` 파일의 `drawConnections` 및 `drawLandmarkPoints` 함수에서 랜드마크의 `x`, `y` 좌표에 각각 `this.canvas.width`와 `this.canvas.height`를 곱하도록 수정했습니다.

```javascript
// web_prototype/src/client/js/core/landmark-renderer.js
// ... inside drawConnections()
this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);

// ... inside drawLandmarkPoints()
this.ctx.arc(landmark.x * this.canvas.width, landmark.y * this.canvas.height, this.landmarkStyle.radius * 2, 0, 2 * Math.PI);
this.ctx.arc(landmark.x * this.canvas.width, landmark.y * this.canvas.height, this.landmarkStyle.radius, 0, 2 * Math.PI);
```

### 5.3. 문제 상황: `onMediaPipeResults` 호출 누락
랜드마크가 그려지지 않는 또 다른 원인으로, `faceDetector.onMediaPipeResults` 함수가 `main.js`의 `processFrame` 루프 내에서 명시적으로 호출되지 않아 MediaPipe의 감지 결과가 랜드마크 렌더러로 전달되지 않는 문제가 있었습니다.

**핵심 단서:**
*   `face-detection.js`에서 `FaceLandmarker.detectForVideo` 호출 후 결과는 반환되지만, 렌더링 관련 로직을 포함하는 `onMediaPipeResults`가 실행되지 않음.
*   `main.js`의 `processFrame` 루프는 `faceDetector.detectFaces`를 호출하지만, 그 결과로 받은 데이터를 `onMediaPipeResults`로 명시적으로 전달하는 부분이 없음.

**추론 과정 및 해결 방향:**
`FaceDetector` 클래스의 역할은 얼굴 감지 및 랜드마크 렌더링을 포함하고 있습니다. `detectFaces`는 감지된 결과만을 반환하며, 이 결과를 바탕으로 렌더링을 수행하려면 별도의 `onMediaPipeResults` 함수를 호출하여 렌더러에 전달해야 한다고 추론했습니다. `processFrame`은 매 프레임마다 감지 및 렌더링을 조율하는 중심적인 함수이므로, 이곳에서 `onMediaPipeResults`를 호출하는 것이 적절하다고 판단했습니다.

**해결:**
`web_prototype/src/client/js/ui/main.js` 파일의 `processFrame` 함수 내에 `this.faceDetector.onMediaPipeResults(faceResults);` 코드를 추가하여 감지된 랜드마크 결과를 렌더러로 전달하도록 했습니다.

```javascript
// web_prototype/src/client/js/ui/main.js
// ... inside processFrame()
const faceResults = await this.faceDetector.detectFaces(imageData);
// MediaPipe 결과 처리 (랜드마크 렌더링 포함)
this.faceDetector.onMediaPipeResults(faceResults); // 이 줄을 추가
// ...
```

## 6. 결론
이러한 일련의 디버깅 과정을 통해 MediaPipe Face Landmarker 통합 시 발생할 수 있는 복합적인 문제들(파일 로딩, CSP, 모듈 의존성, 데이터 구조 처리, 렌더링 좌표계)을 체계적으로 해결할 수 있었습니다. 각 문제에서 오류 메시지, 코드 흐름, 데이터 구조, 그리고 웹 기술에 대한 사전 지식을 종합하여 해결 방향을 추론하는 것이 중요했습니다. 특히 `console.log`를 이용한 상세 로깅은 보이지 않는 데이터 흐름과 값의 상태를 파악하는 데 결정적인 역할을 했습니다.