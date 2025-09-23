import { strict as assert } from 'node:assert'
import { absolutizeSrc } from '../scripts/post-to-dev.js'

export async function runDevtoAbsolutizeTests() {
  // BASE URL에 트레일링 슬래시가 없어도 올바른 절대 URL 생성
  {
    const base = 'https://wintrover.github.io/blog' // no trailing slash
    assert.equal(
      absolutizeSrc('/assets/images/a.png', base),
      'https://wintrover.github.io/blog/assets/images/a.png'
    )
    assert.equal(
      absolutizeSrc('assets/images/a.png', base),
      'https://wintrover.github.io/blog/assets/images/a.png'
    )
  }

  // BASE URL에 트레일링 슬래시가 있어도 중복 슬래시 없이 생성
  {
    const base = 'https://wintrover.github.io/blog/'
    assert.equal(
      absolutizeSrc('/assets/images/a.png', base),
      'https://wintrover.github.io/blog/assets/images/a.png'
    )
    assert.equal(
      absolutizeSrc('assets/images/a.png', base),
      'https://wintrover.github.io/blog/assets/images/a.png'
    )
  }

  // 이미 /blog/ 하위 경로를 포함한 입력 처리
  {
    const base = 'https://wintrover.github.io/blog'
    assert.equal(
      absolutizeSrc('/blog/assets/images/a.png', base),
      'https://wintrover.github.io/blog/assets/images/a.png'
    )
  }

  // 원격 URL과 data URI는 변경하지 않음
  {
    const base = 'https://wintrover.github.io/blog'
    assert.equal(
      absolutizeSrc('https://example.com/x.png', base),
      'https://example.com/x.png'
    )
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    assert.equal(absolutizeSrc(dataUri, base), dataUri)
  }

  console.log('OK: devto absolutize tests passed')
}