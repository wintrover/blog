// Blog Template Server - AI용 통합 템플릿 서버
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class BlogTemplateServer {
  constructor() {
    this.templatePath = join(__dirname, '../src/templates/unified-template.md')
    this.templates = this.loadTemplates()
  }

  loadTemplates() {
    try {
      const templateContent = readFileSync(this.templatePath, 'utf-8')
      return {
        unified: templateContent
      }
    } catch (error) {
      console.error('Template file not found:', error)
      return {
        unified: this.getDefaultTemplate()
      }
    }
  }

  getDefaultTemplate() {
    return `---
layout: post
title: ""
date: YYYY-MM-DD HH:MM:SS -0000
tags: []
category: Project 또는 Company Work
---

## 🎯 Overview
- **목표**:
- **범위**:
- **예상 결과**:

## 🚀 Implementation
- **기술 스택**:
- **아키텍처**:
- **코드 예시**:

## 🐛 Debugging/Challenges
- **주요 문제**:
- **해결 방안**:
- **학습 내용**:

## 📊 Results
- **성과**:
- **수치**:
- **사용자 피드백**:

## 💡 Key Takeaways
- **핵심 인사이트**:
- **다음 계획**:

---
⚠️ **작성 완료 후, 아래 체크리스트를 모두 충족하는지 반드시 확인하세요:**

### ✅ 검증 체크리스트
- [ ] **🎯 Overview**: 목표와 범위가 명확한가?
- [ ] **🚀 Implementation**: 기술 스택과 코드 예시가 있는가?
- [ ] **🐛 Debugging**: 구체적인 문제와 해결 과정이 있는가?
- [ ] **📊 Results**: 수치 데이터나 성과 지표가 있는가?
- [ ] **💡 Key Takeaways**: 배운 점과 향후 계획이 명확한가?`
  }

  // 템플릿 제공 (자동 검증 포함)
  async getTemplate(params) {
    const { type, topic } = params

    // 타입에 따른 안내 메시지
    const typeGuidance = {
      project: {
        focus: "개인 프로젝트 경험을 중심으로 작성해주세요",
        emphasis: "학습 과정, 기술적 도전, 개인적 성장"
      },
      company: {
        focus: "회사 업무 경험을 중심으로 작성해주세요",
        emphasis: "비즈니스 가치, 협업, 프로세스 개선"
      }
    }

    const guidance = typeGuidance[type] || typeGuidance.project

    return {
      template: this.templates.unified,
      instruction: `이 템플릿을 사용하여 ${topic}에 대한 포스트를 작성하세요.`,
      guidance: {
        focus: guidance.focus,
        emphasis: guidance.emphasis,
        length: "400-800라인 적정"
      },
      auto_validation: {
        enabled: true,
        message: "⚠️ 작성 완료 후, 반드시 모든 섹션이 포함되었는지 직접 확인하고 수정하세요.",
        checklist: [
          "🎯 Overview: 목표와 범위가 명확한가? (50-100자)",
          "🚀 Implementation: 기술 스택과 구체적인 코드 예시가 있는가?",
          "🐛 Debugging: 최소 1개의 구체적인 문제와 해결 과정이 있는가?",
          "📊 Results: 수치 데이터나 성과 지표가 있는가?",
          "💡 Key Takeaways: 배운 점과 향후 계획이 명확한가?"
        ]
      },
      validation_rules: {
        required_sections: ["🎯", "🚀", "🐛", "📊", "💡"],
        minimum_length_per_section: 50,
        must_include_code: true,
        must_include_metrics: true
      }
    }
  }

  // 포스트 내용 검증
  async validateContent(content, params) {
    const { template_type } = params
    const errors = []
    const warnings = []

    // 필수 섹션 확인
    const requiredSections = ["🎯 Overview", "🚀 Implementation", "🐛 Debugging", "📊 Results", "💡 Key Takeaways"]

    for (const section of requiredSections) {
      if (!content.includes(`## ${section}`)) {
        errors.push(`필수 섹션이 누락되었습니다: ${section}`)
      }
    }

    // 코드 예시 확인
    if (!content.includes('```')) {
      errors.push("Implementation 섹션에 코드 예시가 필요합니다")
    }

    // 수치 데이터 확인
    const hasMetrics = /\d+%|\d+ms|\d+개|\d+배|\d+건/g.test(content)
    if (!hasMetrics) {
      warnings.push("Results 섹션에 구체적인 수치 데이터를 추가하세요")
    }

    // 길이 확인
    const lines = content.split('\n').length
    if (lines < 200) {
      warnings.push(`포스트가 너무 짧습니다 (${lines}라인). 최소 400라인 이상 권장`)
    } else if (lines > 1000) {
      warnings.push(`포스트가 너무 깁니다 (${lines}라인). 800라인 내외로 권장`)
    }

    return {
      is_valid: errors.length === 0,
      score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5)),
      errors,
      warnings,
      suggestions: errors.length > 0 ? [
        "누락된 섹션을 모두 포함시켜 주세요",
        "코드 예시와 수치 데이터를 꼭 넣어주세요"
      ] : []
    }
  }
}

// MCP 서버 핸들러
export async function handleRequest(request) {
  const server = new BlogTemplateServer()

  switch (request.method) {
    case 'get_template':
      return await server.getTemplate(request.params)

    case 'validate_content':
      return await server.validateContent(request.content, request.params)

    default:
      throw new Error(`Unknown method: ${request.method}`)
  }
}

// CLI 테스트용
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new BlogTemplateServer()

  // 테스트: 템플릿 가져오기
  const template = await server.getTemplate({
    type: 'company',
    topic: 'KYC 시스템 디버깅'
  })

  console.log('Template Response:')
  console.log(JSON.stringify(template, null, 2))
}