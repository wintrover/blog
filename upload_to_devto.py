#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dev.to 블로그 포스트 업로드 스크립트

주요 해결된 문제들:
1. python-dotenv 환경변수 로딩 실패 → .env 파일 직접 파싱으로 해결
2. Dev.to API 헤더 형식 오류 → 소문자 헤더명과 Forem API v1 형식 사용
3. API 요청 데이터 구조 오류 → 'article' 객체로 감싸는 형식 적용
4. 401 Unauthorized 오류 → 올바른 API 키 형식과 헤더 설정으로 해결
5. Mermaid 그래프 렌더링 문제 및 해결 방법:
   - 문제: Dev.to는 mermaid 코드 블록을 직접 지원하지 않음
   - 해결 방법: Mermaid 그래프를 이미지로 변환하여 사용
     * Mermaid Live Editor (https://mermaid.live) 사용
     * 생성된 이미지를 assets/images/ 폴더에 저장
     * GitHub에 푸시하여 공개 URL 생성
     * Dev.to 포스트에서 GitHub 이미지 URL로 호출
     * 예시: ![Mermaid Diagram](https://raw.githubusercontent.com/username/repo/main/assets/images/diagram.png)

사용법:
    python upload_to_devto.py <markdown_file_path>

예시:
    python upload_to_devto.py _posts/2024-01-01-my-post.md

필수 설정:
    .env 파일에 DEVTO_API_KEY=your_actual_api_key 설정 필요
"""

import os
import sys
import json
import requests
import re
from pathlib import Path
from dotenv import load_dotenv

# .env 파일에서 환경변수 로드
# 주의: python-dotenv가 제대로 작동하지 않는 경우가 있어 직접 파싱도 구현함
load_dotenv()

def extract_frontmatter_and_content(file_path):
    """마크다운 파일에서 front matter와 본문을 분리"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # front matter 패턴 매칭
    frontmatter_pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(frontmatter_pattern, content, re.DOTALL)
    
    if match:
        frontmatter_text = match.group(1)
        body_content = match.group(2)
        
        # front matter 파싱
        frontmatter = {}
        for line in frontmatter_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip().strip('"\'')
                
                if key == 'tags':
                    # 태그 처리: #을 제거하고 리스트로 변환
                    if value.startswith('[') and value.endswith(']'):
                        # 배열 형태: [tag1, tag2]
                        tags = [tag.strip().strip('"\'\'').lstrip('#') for tag in value[1:-1].split(',')]
                    else:
                        # 문자열 형태: "tag1, tag2" 또는 tag1, tag2
                        tags = [tag.strip().lstrip('#') for tag in value.split(',')]
                    frontmatter[key] = [tag for tag in tags if tag]  # 빈 태그 제거
                elif key == 'category':
                    # category를 태그로 변환
                    frontmatter['tags'] = frontmatter.get('tags', []) + [value.lower().replace(' ', '')]
                elif key in ['published', 'draft']:
                    frontmatter[key] = value.lower() in ['true', 'yes', '1']
                else:
                    frontmatter[key] = value
        
        return frontmatter, body_content
    else:
        return {}, content

# 이미지 업로드 관련 함수들 제거됨 - GitHub Pages URL을 그대로 사용

def upload_to_devto(file_path, api_key):
    """Dev.to에 아티클 업로드"""
    try:
        # 파일 읽기 및 파싱
        frontmatter, body_content = extract_frontmatter_and_content(file_path)
        
        # 이미지 처리: GitHub Pages URL을 그대로 사용
        print("🔍 이미지 URL 확인 중...")
        
        # API 요청 데이터 구성 (article 객체로 감싸기)
        article_data = {
            "article": {
                "title": frontmatter.get('title', 'Untitled'),
                "body_markdown": body_content.strip(),
                "published": frontmatter.get('published', False),
                "tags": frontmatter.get('tags', [])
            }
        }
        
        # 태그 처리 (Dev.to는 최대 4개 태그만 허용)
        if 'tags' in frontmatter:
            tags = frontmatter['tags']
            if isinstance(tags, str):
                # 문자열인 경우 쉼표로 분리
                tags = [tag.strip() for tag in tags.split(',')]
            elif isinstance(tags, list):
                # 리스트인 경우 그대로 사용
                tags = [str(tag).strip() for tag in tags]
            
            # 최대 4개까지만 허용 (Dev.to API 제한사항)
            tags = tags[:4]
            article_data["article"]["tags"] = tags
        
        # 선택적 필드 추가
        if 'description' in frontmatter:
            article_data["article"]["description"] = frontmatter['description']
        if 'canonical_url' in frontmatter:
            article_data["article"]["canonical_url"] = frontmatter['canonical_url']
        if 'cover_image' in frontmatter:
            article_data["article"]["main_image"] = frontmatter['cover_image']
        if 'series' in frontmatter:
            article_data["article"]["series"] = frontmatter['series']
        
        # 문제 2: Dev.to API 헤더 형식 문제
        # 해결: 대문자 헤더명 대신 소문자 사용, Forem API v1 형식 준수
        # 잘못된 형식: {'API-Key': api_key, 'Content-Type': 'application/json'}
        # 올바른 형식: {'api-key': api_key, 'accept': 'application/vnd.forem.api-v1+json'}
        # API 요청 헤더
        headers = {
            'api-key': api_key,  # Dev.to API 키 (대소문자 구분 없음)
            'accept': 'application/vnd.forem.api-v1+json',  # Forem API v1 지정 (필수)
            'content-type': 'application/json',  # JSON 형식 지정
            'User-Agent': 'BlogUploader/1.0'
        }
        
        print(f"업로드 중: {frontmatter.get('title', 'Untitled')}")
        print(f"태그: {', '.join(frontmatter.get('tags', []))}")
        print(f"발행 상태: {'발행됨' if frontmatter.get('published', False) else '초안'}")
        
        # Dev.to API 호출
        # POST /api/articles 엔드포인트 사용
        response = requests.post(
            'https://dev.to/api/articles',
            headers=headers,
            json=article_data,
            timeout=30
        )
        
        print(f"전송된 JSON 데이터 길이: {len(str(article_data))}자")
        
        # 응답 처리
        if response.status_code == 201:
            # 성공: 201 Created 상태코드 반환
            result = response.json()
            print(f"✅ 게시물이 성공적으로 업로드되었습니다!")
            print(f"제목: {result['title']}")
            print(f"URL: {result['url']}")
            print(f"ID: {result['id']}")
            return True
        else:
            # 실패: 401 Unauthorized가 가장 흔한 오류
            # 401 오류 원인: 잘못된 API 키, 헤더 형식 오류, 요청 구조 오류
            print(f"❌ 업로드 실패: {response.status_code}")
            print(f"응답: {response.text}")
            print(f"JSON 데이터 길이: {len(json.dumps(article_data))} 문자")
            return False
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return False

def main():
    if len(sys.argv) != 2:
        print("사용법: python upload_to_devto.py <마크다운_파일_경로>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # 파일 존재 확인
    if not os.path.exists(file_path):
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        sys.exit(1)
    
    # .env 파일 로드
    load_dotenv()
    
    # API 키 확인
    # 문제 1: python-dotenv의 load_dotenv()가 환경변수를 제대로 로드하지 못하는 경우가 있음
    # 해결: 환경변수에서 먼저 시도하고, 실패하면 .env 파일을 직접 파싱
    api_key = os.getenv('DEVTO_API_KEY')
    
    # .env 파일에서 직접 파싱 (load_dotenv가 제대로 작동하지 않는 경우)
    # 'your_api_key_here'는 기본값으로 설정된 경우를 감지
    if not api_key or api_key == 'your_api_key_here':
        if os.path.exists('.env'):
            with open('.env', 'r') as f:
                for line in f:
                    if line.startswith('DEVTO_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        break
    
    if not api_key:
        print("❌ DEVTO_API_KEY가 .env 파일이나 환경변수에 설정되지 않았습니다.")
        print(".env 파일에 다음과 같이 설정하세요:")
        print("DEVTO_API_KEY=your_api_key_here")
        sys.exit(1)
    
    # 업로드 실행
    success = upload_to_devto(file_path, api_key)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()