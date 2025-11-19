import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

// markdown.js의 parseMarkdown을 직접 import
import { parseMarkdown } from '../src/lib/markdown.js'

// dev.to absolutize 테스트 포함
import { runDevtoAbsolutizeTests } from '../tests/devto-absolutize.test.js'

function extractImgSrcs(html) {
  const out = []
  const re = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}

async function testImageNormalization() {
  const cases = [
    { md: '![a](../assets/images/09/wandb-lfw-insightface-arcface.svg)', expect: '/blog/images/09-wandb-lfw-insightface-arcface.svg' },
    { md: '![a](/assets/images/09/wandb-lfw-insightface-arcface.svg)', expect: '/blog/images/09-wandb-lfw-insightface-arcface.svg' },
    { md: '![a](assets/images/09/wandb-lfw-insightface-arcface.svg)', expect: '/blog/images/09-wandb-lfw-insightface-arcface.svg' },
    { md: '![a](/blog/assets/images/09/wandb-lfw-insightface-arcface.svg)', expect: '/blog/images/09-wandb-lfw-insightface-arcface.svg' },
    { md: '<img src="/assets/images/09/wandb-lfw-insightface-arcface.svg" alt="a" />', expect: '/blog/images/09-wandb-lfw-insightface-arcface.svg' }
  ]

  for (const c of cases) {
    const { html } = parseMarkdown(c.md)
    const srcs = extractImgSrcs(html)
    assert.equal(srcs.length, 1, 'one img expected')
    assert.equal(srcs[0], c.expect, `normalized src should be ${c.expect}`)
  }
}

(async () => {
  try {
    if (typeof parseMarkdown !== 'function') throw new Error('parseMarkdown not imported')
    await testImageNormalization()
    await runDevtoAbsolutizeTests()
    console.log('OK: image path normalization tests passed')
  } catch (err) {
    console.error('TEST FAILURE:', err)
    process.exit(1)
  }
})()