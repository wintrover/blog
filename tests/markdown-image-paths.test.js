import { normalizeImageSrc } from '../src/lib/markdown.js'

// 테스트용 BASE_URL 모킹
const mockBaseUrl = '/blog/'
global.import = {
  meta: {
    env: {
      BASE_URL: mockBaseUrl
    }
  }
}

describe('normalizeImageSrc', () => {
  test('원격 URL은 변경하지 않음', () => {
    expect(normalizeImageSrc('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
    expect(normalizeImageSrc('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
  })

  test('data URI는 변경하지 않음', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    expect(normalizeImageSrc(dataUri)).toBe(dataUri)
  })

  test('절대 경로에 BASE_URL 접두', () => {
    expect(normalizeImageSrc('/assets/images/test.jpg')).toBe('/blog/images/test.jpg')
    expect(normalizeImageSrc('/images/test.png')).toBe('/blog/images/test.png')
    expect(normalizeImageSrc('/favicon.ico')).toBe('/blog/favicon.ico')
  })

  test('상대 경로에 BASE_URL 접두', () => {
    expect(normalizeImageSrc('assets/images/test.jpg')).toBe('/blog/images/test.jpg')
    expect(normalizeImageSrc('images/test.png')).toBe('/blog/images/test.png')
    expect(normalizeImageSrc('test.jpg')).toBe('/blog/test.jpg')
  })

  test('이전 하드코딩된 /blog/ 경로 처리', () => {
    expect(normalizeImageSrc('/blog/assets/images/test.jpg')).toBe('/blog/images/test.jpg')
    expect(normalizeImageSrc('/blog/images/test.png')).toBe('/blog/images/test.png')
  })

  test('이미 BASE_URL로 시작하는 경로는 그대로 유지', () => {
    expect(normalizeImageSrc('/blog/images/test.jpg')).toBe('/blog/images/test.jpg')
  })

  test('상대 경로 내 assets 포함 처리', () => {
    expect(normalizeImageSrc('../assets/images/test.jpg')).toBe('/blog/images/test.jpg')
    expect(normalizeImageSrc('./assets/images/test.jpg')).toBe('/blog/images/test.jpg')
    expect(normalizeImageSrc('../../assets/images/test.jpg')).toBe('/blog/images/test.jpg')
  })

  test('빈 값이나 잘못된 타입 처리', () => {
    expect(normalizeImageSrc('')).toBe('')
    expect(normalizeImageSrc(null)).toBe(null)
    expect(normalizeImageSrc(undefined)).toBe(undefined)
    expect(normalizeImageSrc(123)).toBe(123)
  })

  test('중복 슬래시 방지', () => {
    // joinBase 함수가 중복 슬래시를 처리하는지 확인
    expect(normalizeImageSrc('/assets/images/test.jpg')).not.toContain('//')
    expect(normalizeImageSrc('assets/images/test.jpg')).not.toContain('//')
  })

  test('특수 문자가 포함된 경로', () => {
    expect(normalizeImageSrc('/assets/images/test%20image.jpg')).toBe('/blog/images/test%20image.jpg')
    expect(normalizeImageSrc('/assets/images/한글이미지.jpg')).toBe('/blog/images/한글이미지.jpg')
  })
})