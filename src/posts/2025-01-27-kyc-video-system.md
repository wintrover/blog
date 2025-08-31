---
title: "KYC 비디오 녹화 및 분할 시스템 개발기: React + FFmpeg + MediaRecorder API"
date: 2025-01-27 00:00:00 -0000
tags: react typescript ffmpeg mediarecorder kyc video-processing
category: Frontend Development
excerpt: "KYC 프로세스에서 사용자 얼굴 인식 과정을 전체 비디오로 녹화하고 단계별로 분할하는 시스템을 React와 FFmpeg를 활용해 개발한 경험을 공유합니다."
---

## 프로젝트 개요

KYC(Know Your Customer) 프로세스에서 사용자의 얼굴 인식 과정을 전체 비디오로 녹화하고, 각 단계별로 분할하여 저장하는 시스템을 개발했습니다. 이 프로젝트는 **React**, **TypeScript**, **FFmpeg**, **MediaRecorder API**를 핵심 기술로 사용했으며, 웹 환경에서의 실시간 비디오 처리라는 도전적인 과제를 해결했습니다.

## 🎯 주요 기능 구현

### 1. 비디오 녹화 시스템

**MediaRecorder API**를 활용하여 KYC 미션 시작부터 종료까지 전체 과정을 녹화하는 시스템을 구현했습니다.

```typescript
// 비디오 녹화 시작
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  
  mediaRecorder.start();
};
```

**타임라인 데이터 구조**를 설계하여 각 KYC 단계별 시작/종료 timestamp를 정확히 기록했습니다:

```typescript
interface KYCTimeline {
  stepIndex: number;
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
}
```

### 2. FFmpeg 웹 환경 구축

웹 브라우저에서 FFmpeg를 사용하기 위해 여러 기술적 도전을 해결했습니다.

#### Cross-Origin 헤더 설정

SharedArrayBuffer 사용을 위한 필수 헤더 구성:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
```

#### FFmpeg 초기화

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

const loadFFmpeg = async () => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });
};
```

### 3. 비디오 분할 및 처리 파이프라인

타임라인 데이터를 기반으로 비디오를 단계별로 분할하는 시스템을 구현했습니다.

```typescript
const splitVideo = async (videoBlob: Blob, timeline: KYCTimeline[]) => {
  // 비디오를 FFmpeg 가상 파일 시스템에 쓰기
  await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));
  
  const splitVideos = [];
  
  for (const [index, step] of timeline.entries()) {
    const startTime = formatTime(step.startTime);
    const duration = formatTime(step.duration);
    const outputName = `step${index}_${step.stepName}.webm`;
    
    // FFmpeg 명령어로 비디오 분할
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-ss', startTime,
      '-t', duration,
      '-c', 'copy',
      outputName
    ]);
    
    // 분할된 비디오 읽기
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/webm' });
    splitVideos.push({ name: outputName, blob });
  }
  
  return splitVideos;
};
```

#### 시간 형식 변환 유틸리티

```typescript
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};
```

## 🔧 주요 시행착오 및 해결 과정

### 1. OpenCV.js COEP Cross-Origin 문제

**문제**: `net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` 오류로 OpenCV.js CDN 로딩 실패

**해결**: CDN 대신 로컬 호스팅 방식 채택

```typescript
// 기존 CDN 방식 (실패)
// <script src="https://docs.opencv.org/4.x/opencv.js"></script>

// 로컬 호스팅 방식 (성공)
// public/opencv.js 파일 다운로드 후
<script src="/opencv.js"></script>
```

### 2. 중복 비디오 업로드 방지

**문제**: 동일한 비디오가 여러 번 업로드되는 현상

**해결**: 상태 관리와 참조 비교를 통한 중복 방지

```typescript
const [isVideoUploaded, setIsVideoUploaded] = useState(false);
const uploadedBlobRef = useRef<Blob | null>(null);

const uploadVideo = async (videoBlob: Blob) => {
  // 중복 업로드 방지
  if (isVideoUploaded && uploadedBlobRef.current === videoBlob) {
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('video', videoBlob, 'kyc-recording.webm');
    
    await fetch('/api/upload-video', {
      method: 'POST',
      body: formData
    });
    
    setIsVideoUploaded(true);
    uploadedBlobRef.current = videoBlob;
  } catch (error) {
    console.error('비디오 업로드 실패:', error);
  }
};
```

### 3. 메모리 관리 및 성능 최적화

**문제**: 대용량 비디오 처리 시 메모리 부족 및 성능 저하

**해결**: 적절한 리소스 관리와 정리

```typescript
const processVideo = async (videoBlob: Blob) => {
  try {
    // 비디오 처리 로직
    const splitVideos = await splitVideo(videoBlob, timeline);
    
    // 분할된 비디오 업로드
    const uploadResults = await Promise.allSettled(
      splitVideos.map(video => uploadSplitVideo(video))
    );
    
    // 성공/실패 카운팅
    const successful = uploadResults.filter(result => result.status === 'fulfilled').length;
    const failed = uploadResults.filter(result => result.status === 'rejected').length;
    
    if (failed > 0) {
      console.error(`비디오 업로드 실패: ${failed}개, 성공: ${successful}개`);
    }
  } finally {
    // 메모리 정리
    await cleanupFFmpegFiles();
  }
};

const cleanupFFmpegFiles = async () => {
  try {
    const files = ['input.webm', ...timeline.map((_, i) => `step${i}_output.webm`)];
    for (const file of files) {
      try {
        await ffmpeg.deleteFile(file);
      } catch {
        // 파일이 없는 경우 무시
      }
    }
  } catch (error) {
    console.error('FFmpeg 파일 정리 실패:', error);
  }
};
```

## 🚀 기술 스택 및 아키텍처

### Frontend 기술 스택
- **React 19** + **TypeScript**: 컴포넌트 기반 UI 개발
- **@tanstack/react-query**: 서버 상태 관리
- **@tanstack/react-router**: 라우팅
- **Styled Components**: CSS-in-JS 스타일링
- **TailwindCSS**: 유틸리티 기반 스타일링

### 비디오 처리 기술
- **MediaRecorder API**: 실시간 비디오 녹화
- **FFmpeg.wasm**: 웹 환경에서의 비디오 처리
- **OpenCV.js**: 컴퓨터 비전 처리
- **MediaPipe**: 얼굴 인식 및 추적

### 개발 도구
- **Vite**: 빌드 도구 및 개발 서버
- **Jest**: 단위 테스트
- **SonarQube**: 코드 품질 분석
- **Sentry**: 에러 모니터링

## 📈 성과 및 학습 포인트

### 성과
1. **웹 환경에서의 실시간 비디오 처리** 시스템 구축 완료
2. **FFmpeg.wasm을 활용한 클라이언트 사이드 비디오 분할** 구현
3. **Cross-Origin 정책과 SharedArrayBuffer** 관련 이슈 해결
4. **메모리 효율적인 대용량 파일 처리** 로직 구현

### 주요 학습 포인트
1. **웹 보안 정책**: COEP, COOP 헤더의 중요성과 외부 리소스 로딩 제약
2. **WebAssembly 활용**: 네이티브 성능이 필요한 작업의 웹 환경 구현
3. **비동기 처리 최적화**: Promise.allSettled를 활용한 안정적인 병렬 처리
4. **리소스 관리**: 웹 환경에서의 메모리 누수 방지와 적절한 정리

## 🔮 향후 개선 방향

1. **Web Workers 활용**: 메인 스레드 블로킹 방지를 위한 백그라운드 처리
2. **Progressive Upload**: 대용량 파일의 청크 단위 업로드
3. **실시간 압축**: 녹화 중 실시간 비디오 압축으로 파일 크기 최적화
4. **오프라인 지원**: Service Worker를 활용한 네트워크 불안정 상황 대응

---

이 프로젝트를 통해 웹 환경에서의 고급 비디오 처리 기술을 습득할 수 있었으며, 특히 브라우저의 보안 정책과 WebAssembly 활용에 대한 깊은 이해를 얻을 수 있었습니다. 앞으로도 웹 기술의 한계를 뛰어넘는 도전적인 프로젝트에 계속 도전해보고 싶습니다.