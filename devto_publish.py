import os
import sys
import logging
from typing import Tuple, Dict, Any

import requests
import yaml
from dotenv import load_dotenv

# 로깅 설정 – 콘솔에 시간ㆍ레벨ㆍ메시지 모두 출력
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# .env 파일을 자동으로 읽어 환경변수 주입
try:
    load_dotenv()
    logging.debug(".env 파일 로드 완료")
except Exception as err:  # 예외는 발생하지 않지만 혹시 몰라 래핑
    logging.warning(".env 로드 중 예기치 못한 문제 발생: %s", err)

_MAX_LIST_PER_PAGE: int = 100

class DevtoPublisherError(Exception):
    """dev.to 퍼블리싱 중 발생한 예외를 래핑하기 위한 커스텀 예외"""


class SafeYamlLoader:
    """프론트매터를 안전하게 로드하기 위한 헬퍼"""

    @staticmethod
    def load(front_matter: str) -> Dict[str, Any]:
        try:
            data = yaml.safe_load(front_matter)
            logging.debug("YAML 프론트매터 파싱 성공: %s", data)
            return data or {}
        except yaml.YAMLError as err:
            logging.exception("YAML 파싱 실패")
            raise DevtoPublisherError("YAML 파싱 중 오류가 발생했습니다") from err


class MarkdownPost:
    """Jekyll 마크다운 포스트를 dev.to 업로드 포맷으로 변환"""

    def __init__(self, filepath: str) -> None:
        self.filepath = filepath
        self.front_matter: Dict[str, Any] = {}
        self.body_markdown: str = ""

    def parse(self) -> None:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                raw = f.read()
            logging.debug("파일 %s 로드 완료 (%d bytes)", self.filepath, len(raw))
        except OSError as err:
            logging.exception("파일 로드 실패: %s", self.filepath)
            raise DevtoPublisherError("포스트 파일을 읽지 못했습니다") from err

        if not raw.startswith("---"):
            raise DevtoPublisherError("YAML 프론트매터가 존재하지 않습니다")

        try:
            _, fm, body = raw.split("---", 2)
            self.front_matter = SafeYamlLoader.load(fm)
            self.body_markdown = body.strip()
            logging.info("프론트매터와 본문 파싱 완료")
        except ValueError as err:
            logging.exception("프론트매터 분리 실패")
            raise DevtoPublisherError("프론트매터 구문이 올바르지 않습니다") from err

    def to_devto_payload(self, published: bool = True) -> Dict[str, Any]:
        title = self.front_matter.get("title")
        tags = self.front_matter.get("tags", [])
        if isinstance(tags, list):
            tags_csv = ",".join(tags)
        else:
            tags_csv = str(tags)

        if not title:
            raise DevtoPublisherError("프론트매터에 'title' 항목이 필요합니다")

        payload = {
            "article": {
                "title": title,
                "published": published,
                "body_markdown": self.body_markdown,
                "tags": tags_csv,
            }
        }
        logging.debug("dev.to payload 구성 완료: %s", payload)
        return payload


class DevtoClient:
    """dev.to API 클라이언트"""

    BASE_URL = "https://dev.to/api"

    def __init__(self, api_key: str):
        if not api_key:
            raise DevtoPublisherError("환경변수 DEVTO_API_KEY 가 설정되지 않았습니다")
        self.session = requests.Session()
        self.session.headers.update({"api-key": api_key, "Content-Type": "application/json"})
        logging.debug("dev.to 세션 초기화 완료")

    def publish(self, payload: Dict[str, Any]) -> Tuple[int, str]:
        url = f"{self.BASE_URL}/articles"
        try:
            resp = self.session.post(url, json=payload, timeout=30)
            logging.info("dev.to 응답 상태코드: %s", resp.status_code)
            resp.raise_for_status()
            article_url = resp.json().get("url", "(unknown)")
            logging.info("게시 성공: %s", article_url)
            return resp.status_code, article_url
        except requests.RequestException as err:
            logging.exception("dev.to 업로드 실패")
            raise DevtoPublisherError("dev.to 업로드 중 오류가 발생했습니다") from err

    # 내 글 목록 조회 (draft / published)
    def list_my_articles(self, state: str = "all") -> list[dict]:
        """/articles/me 엔드포인트 호출

        state: all | draft | published |
        returns: list[dict]
        """
        url = f"{self.BASE_URL}/articles/me"
        params = {"state": state, "per_page": _MAX_LIST_PER_PAGE}
        try:
            resp = self.session.get(url, params=params, timeout=30)
            logging.info("목록 조회 status: %d", resp.status_code)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as err:
            logging.exception("목록 조회 실패")
            raise DevtoPublisherError("dev.to 글 목록을 읽지 못했습니다") from err

    def update_article(self, article_id: int, payload: Dict[str, Any]) -> Tuple[int, str]:
        """PUT /articles/{id}"""
        url = f"{self.BASE_URL}/articles/{article_id}"
        try:
            resp = self.session.put(url, json=payload, timeout=30)
            logging.info("업데이트 status: %d", resp.status_code)
            resp.raise_for_status()
            article_url = resp.json().get("url", "(unknown)")
            logging.info("업데이트 성공: %s", article_url)
            return resp.status_code, article_url
        except requests.RequestException as err:
            logging.exception("업데이트 실패")
            raise DevtoPublisherError("dev.to 글 업데이트 중 오류가 발생했습니다") from err


def main() -> None:
    if len(sys.argv) < 2:
        logging.error("사용법: python devto_publish.py <markdown_file_path> [--draft] [--update]")
        sys.exit(1)

    filepath = sys.argv[1]
    draft_flag = "--draft" in sys.argv[2:]
    update_flag = "--update" in sys.argv[2:]

    try:
        post = MarkdownPost(filepath)
        post.parse()
        payload = post.to_devto_payload(published=not draft_flag)

        api_key = os.environ.get("DEVTO_API_KEY")
        client = DevtoClient(api_key)

        if update_flag:
            # 동일 제목의 드래프트를 찾아 업데이트
            articles = client.list_my_articles(state="draft")
            target = next((a for a in articles if a.get("title") == post.front_matter.get("title")), None)
            if target:
                article_id = target.get("id")
                status, url = client.update_article(article_id, payload)
                logging.info("초안 업데이트 완료: %s (HTTP %d)", url, status)
            else:
                logging.warning("일치하는 초안이 없어 새로 생성합니다")
                status, url = client.publish(payload)
                logging.info("새 초안 생성: %s (HTTP %d)", url, status)
        else:
            status, url = client.publish(payload)
            logging.info("%s 로 업로드 완료 (HTTP %d)", url, status)
    except DevtoPublisherError as err:
        logging.error("작업 실패: %s", err)
        sys.exit(2)


if __name__ == "__main__":
    main() 