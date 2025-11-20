import requests
import mimetypes
import time
import os
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

from ..data_classes import TweetPost

load_dotenv()
TWITTER_BEARER = os.getenv("TWITTER_BEARER_TOKEN")
UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024


class TweetPostError(Exception):
    """Custom exception for TweetPostTool errors."""
    pass


class TweetPostTool:
    """Publish tweets and upload media via Twitter/X API."""
    def __init__(self, agent_id: int, api_bearer: str = None):
        self.agent_id = agent_id
        if TWITTER_BEARER:
            api_bearer = TWITTER_BEARER
        self.post_api_base = "https://api.twitter.com/2"
        self.api_bearer = api_bearer
        self.upload_url = "https://upload.twitter.com/1.1/media/upload.json"
        self.post_headers = {
            "Authorization": f"Bearer {self.api_bearer}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def post_tweet(self, content: str, trade_id: Optional[int] = None, trade_summary: Optional[str] = None,
                   media_url: Optional[str] = None, reply_to_id: Optional[str] = None,
                   personality_signature: Optional[str] = None) -> TweetPost:
        if not self.api_bearer:
            raise TweetPostError("Twitter bearer token is missing, unable to authenticate the API request.")
        if not content:
            raise ValueError("Tweet content cannot be empty.")

        url = f"{self.post_api_base}/tweets"
        payload = {"text": content}
        if trade_summary:
            payload["text"] += f"\n\nSummary: {trade_summary}"
        if personality_signature:
            payload["text"] += f"\n\n— {personality_signature}"
        if media_url:
            try:
                media_id = self._upload_media(media_url)
                payload["media"] = {"media_ids": [media_id]}
            except Exception as e:
                raise TweetPostError(f"Media upload failed: {str(e)}")
        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}

        try:
            response = requests.post(url, json=payload, headers=self.post_headers)
            if response.status_code != 201:
                raise TweetPostError(
                    f"Error occured when attempting to connect with Twitter API: {response.status_code} {response.text}"
                )
            data = response.json().get("data", {})
            return TweetPost(
                agent_id=self.agent_id,
                content=payload["text"],
                timestamp=datetime.now(timezone.utc),
                twitter_id=data.get("id"),
                trade_id=trade_id,
                trade_summary=trade_summary,
                media_url=media_url,
                reply_to_id=reply_to_id,
                personality_signature=personality_signature,
            )
        except requests.RequestException as e:
            raise TweetPostError(f"Failed to connect to the Twitter API due to {str(e)}")

    def _upload_media(self, media_url: str) -> str:
        try:
            file_response = requests.get(media_url)
            if file_response.status_code != 200:
                raise TweetPostError(f"Failed to download media from provided URL: {media_url}")
        except requests.RequestException as e:
            raise TweetPostError(f"Error occured while trying to download media due to: {str(e)}")

        file_bytes = file_response.content
        file_size = len(file_bytes)
        mime_type, _ = mimetypes.guess_type(media_url)
        if not mime_type:
            mime_type = "application/octet-stream"

        if file_size <= UPLOAD_CHUNK_SIZE:
            return self._simple_upload(file_bytes, mime_type)
        else:
            return self._chunked_upload(file_bytes, mime_type)

    def _simple_upload(self, file_bytes: bytes, mime_type: str) -> str:
        try:
            response = requests.post(
                self.upload_url,
                headers={"Authorization": f"Bearer {self.api_bearer}"},
                files={"media": ("file", file_bytes, mime_type)},
            )
            if response.status_code != 200:
                raise TweetPostError(f"Simple upload failed due to: {response.text}")
            return response.json().get("media_id_string")
        except requests.RequestException as e:
            raise TweetPostError(f"Simple upload failed due to: {str(e)}")

    def _chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        media_id = self._init_chunked_upload(file_bytes, mime_type)
        self._append_chunked_upload(file_bytes, media_id)
        self._finalize_chunked_upload(media_id)
        return media_id

    def _init_chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        try:
            if not mime_type.startswith("video/"):
                raise TweetPostError("Chunked upload only supported for video types.")
            params = {
                "command": "INIT",
                "media_type": mime_type,
                "total_bytes": len(file_bytes),
                "media_category": "tweet_video",
            }
            response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
            if response.status_code != 200:
                raise TweetPostError(f"INIT failed: {response.status_code} {response.text}")
            media_id = response.json().get("media_id_string")
            if not media_id:
                raise TweetPostError("INIT response missing media id string.")
            return media_id
        except requests.RequestException as e:
            raise TweetPostError(f"INIT request failed: {str(e)}")

    def _append_chunked_upload(self, file_bytes: bytes, media_id: str) -> None:
        segment_index = 0
        for i in range(0, len(file_bytes), UPLOAD_CHUNK_SIZE):
            chunk = file_bytes[i: i + UPLOAD_CHUNK_SIZE]
            params = {"command": "APPEND", "media_id": media_id, "segment_index": segment_index}
            try:
                response = requests.post(
                    self.upload_url,
                    headers={"Authorization": f"Bearer {self.api_bearer}"},
                    data=params,
                    files={"media": ("chunk", chunk, "application/octet-stream")},
                )
                if response.status_code not in (204, 202):
                    raise TweetPostError(
                        f"APPEND failed at segment {segment_index}: {response.status_code} {response.text}"
                    )
            except requests.RequestException as e:
                raise TweetPostError(f"APPEND request failed: {str(e)}")
            segment_index += 1

    def _finalize_chunked_upload(self, media_id: str) -> None:
        params = {"command": "FINALIZE", "media_id": media_id}
        try:
            response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
            if response.status_code not in (200, 201, 202):
                raise TweetPostError(f"FINALIZE failed: {response.status_code} {response.text}")
            processing_info = response.json().get("processing_info")
            if not processing_info:
                return
            state = processing_info.get("state")
            if state == "succeeded":
                return
            elif state == "failed":
                raise TweetPostError("Video processing failed after FINALIZE.")
            check_after = processing_info.get("check_after_secs", 1)
            self._poll_status(media_id, check_after)
        except requests.RequestException as e:
            raise TweetPostError(f"FINALIZE request failed: {str(e)}")

    def _poll_status(self, media_id: str, initial_delay: int = 1) -> None:
        delay = initial_delay
        max_attempts = 20
        for i in range(max_attempts):
            time.sleep(delay)
            params = {"command": "STATUS", "media_id": media_id}
            try:
                response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
                if response.status_code != 200:
                    raise TweetPostError(f"STATUS failed: {response.status_code} {response.text}")
                processing_info = response.json().get("processing_info", {})
                state = processing_info.get("state")
                if state == "succeeded":
                    return
                elif state == "failed":
                    raise TweetPostError("Video processing failed during STATUS polling.")
                delay = processing_info.get("check_after_secs", delay)
            except requests.RequestException as e:
                raise TweetPostError(f"STATUS request failed: {str(e)}")
        raise TweetPostError("Video processing timed out during STATUS polling.")
