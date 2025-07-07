import os
import sys
import logging
from typing import Tuple, Dict, Any

import requests
import yaml
from dotenv import load_dotenv
import re
import base64
import zlib
import urllib.parse
import subprocess, hashlib, os
from pathlib import Path

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

            # 1) HTML 코드 블록을 마크다운 펜스로 변환하여 코드 손실 방지
            body = self._convert_html_code_blocks(body)

            # 2) dev.to 렌더에 불필요한 Jekyll 전용 wrapper 제거
            cleaned = self._strip_html_wrappers(body)

            # mermaid 블록은 parse 단계에서 그대로 두고, 이후 client 생성 후 변환함
            self.body_markdown = cleaned.strip()
            logging.info("프론트매터와 본문 파싱 완료")
        except ValueError as err:
            logging.exception("프론트매터 분리 실패")
            raise DevtoPublisherError("프론트매터 구문이 올바르지 않습니다") from err

    def to_devto_payload(self, published: bool = True) -> Dict[str, Any]:
        title = self.front_matter.get("title")
        tags = self.front_matter.get("tags", [])
        if isinstance(tags, list):
            tokens = [str(t).strip() for t in tags if t]
        elif isinstance(tags, str):
            # 공백 또는 콤마 기준 분할
            tokens = [t.strip() for t in re.split(r"[ ,]+", tags) if t.strip()]
        else:
            tokens = []

        # dev.to 는 태그를 최대 4개, 각 태그 30자 이하, 알파뉴메릭·하이픈·언더스코어만 허용
        tags_list = tokens[:4]

        if not title:
            raise DevtoPublisherError("프론트매터에 'title' 항목이 필요합니다")

        # dev.to 는 태그를 최대 4개까지만 허용한다
        payload = {
            "article": {
                "title": title,
                "published": published,
                "body_markdown": self.body_markdown,
                "tags": tags_list,
            }
        }
        logging.debug("dev.to payload 구성 완료: %s", payload)
        return payload

    # ------------------------------------------------------
    # 내부 헬퍼 – HTML <pre><code> 블록을 ```lang 펜스 블록으로 변환
    # ------------------------------------------------------
    @staticmethod
    def _convert_html_code_blocks(markdown_body: str) -> str:
        """Rouge 출력 형태의 <pre class="language-xyz"><code>...</code></pre>를
        dev.to가 이해하는 펜스 코드 블록으로 치환한다."""

        import html
        pattern = re.compile(
            r"<pre[^>]*class=\"[^\"]*language-([^\"\s]+)[^\"]*\"[^>]*>\s*<code[^>]*>(.*?)</code>\s*</pre>",
            re.DOTALL | re.IGNORECASE,
        )

        def _replacer(match: re.Match) -> str:
            language = match.group(1)
            code_html = match.group(2)
            # HTML 엔티티 복원 및 앞뒤 공백 제거
            code_text = html.unescape(code_html.strip())
            return f"```{language}\n{code_text}\n```"

        return pattern.sub(_replacer, markdown_body)

    # ------------------------------------------------------
    # 내부 헬퍼 – dev.to 변환 시 필요 없는 Jekyll 코드 복사/다크모드 블록 제거
    # ------------------------------------------------------
    @staticmethod
    def _strip_html_wrappers(markdown_body: str) -> str:
        """`language-block`, `copy-code-block`, `dark-mode-block` 류의 div 래퍼 제거

        Jekyll 하이라이트용 부가 마크업이 dev.to 에서는 불필요하거나 렌더 문제를 일으킨다.
        필요 시 래퍼 태그만 제거하고 내부 코드는 보존한다.
        """

        unwanted_single_line = (
            "language-block glue-font-weight-medium",
        )
        # 내부 전체를 제거할 블록 – 버튼, 다크모드 토글 등 불필요한 UI 요소
        unwanted_full_block = (
            "copy-code-block",
            "dark-mode-block",
        )
        # 코드 래퍼 – 여는/닫는 태그만 제거하고 내부 내용은 살린다
        code_wrapper_class = "inner-block-content code-block"

        cleaned_lines: list[str] = []
        skip_mode = None  # None | "full"
        in_code_wrapper = False

        for line in markdown_body.splitlines():
            stripped = line.strip()

            # 전체를 제거할 블록 시작 여부 (copy/dark)
            if any(cls in stripped for cls in unwanted_full_block) and "<div" in stripped:
                skip_mode = "full"
                continue

            if skip_mode == "full":
                if "</div>" in stripped:
                    skip_mode = None
                continue

            # 코드 래퍼 div – 태그만 제거, 내부는 살림
            if not in_code_wrapper and code_wrapper_class in stripped and "<div" in stripped:
                in_code_wrapper = True
                continue  # 여는 태그 제거

            if in_code_wrapper:
                if "</div>" in stripped:
                    in_code_wrapper = False  # 닫는 태그 제거
                    continue
                # 내부 라인은 보존
                cleaned_lines.append(line)
                continue

            # 단순 한 줄 div 제거 (language name)
            if any(cls in stripped for cls in unwanted_single_line):
                continue

            # 그 외 일반 라인 보존
            cleaned_lines.append(line)

        return "\n".join(cleaned_lines)

    def convert_mermaid_blocks(self, client: "DevtoClient") -> None:
        """Mermaid 코드 블록을 PNG 로 렌더링 후 dev.to 이미지 업로드 URL 로 치환"""

        import re
        pattern = re.compile(r"```mermaid\n(.*?)```", re.DOTALL | re.IGNORECASE)

        def render_png(mermaid_src: str) -> bytes:
            """kroki 서버에 POST 하여 PNG 바이트 획득"""
            try:
                resp = requests.post("https://kroki.io/mermaid/png", data=mermaid_src.encode("utf-8"), timeout=30)
                resp.raise_for_status()
                return resp.content
            except requests.RequestException as err:
                logging.exception("kroki 렌더 실패")
                raise DevtoPublisherError("Mermaid 렌더링 실패") from err

        def get_repo_info() -> tuple[str, str, str]:
            """현재 git repo 의 (owner, repo, branch) 획득"""
            try:
                remote_url = subprocess.check_output(["git", "config", "--get", "remote.origin.url"], text=True).strip()
                branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True).strip()
            except subprocess.CalledProcessError as err:
                logging.exception("git 정보 조회 실패")
                raise DevtoPublisherError("git 정보를 읽지 못했습니다. 이미지 링크를 만들 수 없습니다") from err

            # remote url 형식 처리
            if remote_url.startswith("git@"):
                # git@github.com:owner/repo.git
                path_part = remote_url.split(":", 1)[1]
            elif remote_url.startswith("https://"):
                path_part = remote_url.split("github.com/")[1]
            else:
                raise DevtoPublisherError("지원하지 않는 remote.origin.url 형식")

            owner_repo = path_part.removesuffix(".git")
            owner, repo = owner_repo.split("/", 1)
            return owner, repo, branch

        owner, repo, branch = get_repo_info()
        images_dir = Path("images")
        images_dir.mkdir(exist_ok=True)

        def _replacer(match: re.Match) -> str:
            mermaid_code = match.group(1).strip()
            # 파일명: mermaid_<hash>.png
            sha = hashlib.sha1(mermaid_code.encode("utf-8")).hexdigest()[:10]
            filename = f"mermaid_{sha}.png"
            filepath = images_dir / filename

            if not filepath.exists():
                png_bytes = render_png(mermaid_code)
                with open(filepath, "wb") as fp:
                    fp.write(png_bytes)
                logging.info("다이어그램 PNG 저장: %s", filepath)

            # raw.githubusercontent.com 경로를 사용하여 dev.to 가 직접 PNG 를 로드할 수 있게 함
            raw_url = (
                f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/images/{filename}"
            )
            return f"![mermaid diagram]({raw_url})"

        self.body_markdown = pattern.sub(_replacer, self.body_markdown)


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
            if resp.status_code == 422 and "Title has already been used" in resp.text:
                # dev.to 의 5분 중복 제한 우회 – 제목 뒤에 공백+점 추가 후 한 번만 재시도
                logging.warning("제목 중복 422 – 한 번에 한해 제목 끝에 '.' 추가 후 재시도합니다")
                new_payload = payload.copy()
                new_payload["article"] = dict(payload["article"])  # shallow copy
                new_payload["article"]["title"] = payload["article"]["title"] + "."
                retry_resp = self.session.post(url, json=new_payload, timeout=30)
                logging.info("재시도 status: %s", retry_resp.status_code)
                retry_resp.raise_for_status()
                article_url = retry_resp.json().get("url", "(unknown)")
                return retry_resp.status_code, article_url

            try:
                resp.raise_for_status()
            except requests.RequestException:
                logging.error("dev.to 응답 본문: %s", resp.text)
                raise
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

    # dev.to API 는 현재 이미지 업로드 엔드포인트를 제공하지 않는다


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

        api_key = os.environ.get("DEVTO_API_KEY")
        client = DevtoClient(api_key)

        # Mermaid 블록을 dev.to 호스팅 이미지로 교체
        post.convert_mermaid_blocks(client)

        payload = post.to_devto_payload(published=not draft_flag)

        if update_flag:
            # 동일 제목 게시글(드래프트 우선) 탐색
            articles = client.list_my_articles(state="draft")
            target = next((a for a in articles if a.get("title") == post.front_matter.get("title")), None)
            if target is None:
                # 최근 5분 중복 오류 방지를 위해 'all' 에서도 검색 (published 포함)
                articles_all = client.list_my_articles(state="all")
                target = next((a for a in articles_all if a.get("title") == post.front_matter.get("title")), None)
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