import requests
import mimetypes
import time
import os
import logging
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

from ..data_classes import TweetPost

load_dotenv()
TWITTER_BEARER = os.getenv("TWITTER_BEARER_TOKEN")
UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024

logger = logging.getLogger(__name__)


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
        logger.info(f"TweetPostTool initialized for agent_id={agent_id}")

    def post_tweet(self, content: str, trade_id: Optional[int] = None, trade_summary: Optional[str] = None,
                   media_url: Optional[str] = None, reply_to_id: Optional[str] = None,
                   personality_signature: Optional[str] = None) -> TweetPost:
        logger.debug(f"Attempting to post tweet for agent_id={self.agent_id}")
        if not self.api_bearer:
            logger.error("Twitter bearer token is missing")
            raise TweetPostError("Twitter bearer token is missing, unable to authenticate the API request.")
        if not content:
            logger.error("Tweet content is empty")
            raise ValueError("Tweet content cannot be empty.")

        url = f"{self.post_api_base}/tweets"
        payload = {"text": content}
        if trade_summary:
            payload["text"] += f"\n\nSummary: {trade_summary}"
        if personality_signature:
            payload["text"] += f"\n\n— {personality_signature}"
        if media_url:
            try:
                logger.debug(f"Uploading media from URL: {media_url}")
                media_id = self._upload_media(media_url)
                payload["media"] = {"media_ids": [media_id]}
                logger.info(f"Media uploaded successfully, media_id={media_id}")
            except Exception as e:
                logger.error(f"Media upload failed: {str(e)}")
                raise TweetPostError(f"Media upload failed: {str(e)}")
        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}

        try:
            logger.debug(f"Sending POST request to Twitter API: {url}")
            response = requests.post(url, json=payload, headers=self.post_headers)
            if response.status_code != 201:
                logger.error(f"Twitter API error: {response.status_code} {response.text}")
                raise TweetPostError(
                    f"Error occured when attempting to connect with Twitter API: {response.status_code} {response.text}"
                )
            data = response.json().get("data", {})
            twitter_id = data.get("id")
            logger.info(f"Tweet posted successfully, twitter_id={twitter_id}")
            return TweetPost(
                agent_id=self.agent_id,
                content=payload["text"],
                timestamp=datetime.now(timezone.utc),
                twitter_id=twitter_id,
                trade_id=trade_id,
                trade_summary=trade_summary,
                media_url=media_url,
                reply_to_id=reply_to_id,
                personality_signature=personality_signature,
            )
        except requests.RequestException as e:
            logger.error(f"Failed to connect to Twitter API: {str(e)}")
            raise TweetPostError(f"Failed to connect to the Twitter API due to {str(e)}")

    def _upload_media(self, media_url: str) -> str:
        logger.debug(f"Downloading media from URL: {media_url}")
        try:
            file_response = requests.get(media_url)
            if file_response.status_code != 200:
                logger.error(f"Failed to download media, status_code={file_response.status_code}")
                raise TweetPostError(f"Failed to download media from provided URL: {media_url}")
        except requests.RequestException as e:
            logger.error(f"Error downloading media: {str(e)}")
            raise TweetPostError(f"Error occured while trying to download media due to: {str(e)}")

        file_bytes = file_response.content
        file_size = len(file_bytes)
        mime_type, _ = mimetypes.guess_type(media_url)
        if not mime_type:
            mime_type = "application/octet-stream"

        logger.debug(f"Media downloaded: size={file_size} bytes, mime_type={mime_type}")

        if file_size <= UPLOAD_CHUNK_SIZE:
            logger.debug("Using simple upload")
            return self._simple_upload(file_bytes, mime_type)
        else:
            logger.debug("Using chunked upload")
            return self._chunked_upload(file_bytes, mime_type)

    def _simple_upload(self, file_bytes: bytes, mime_type: str) -> str:
        try:
            response = requests.post(
                self.upload_url,
                headers={"Authorization": f"Bearer {self.api_bearer}"},
                files={"media": ("file", file_bytes, mime_type)},
            )
            if response.status_code != 200:
                logger.error(f"Simple upload failed: {response.text}")
                raise TweetPostError(f"Simple upload failed due to: {response.text}")
            media_id = response.json().get("media_id_string")
            logger.debug(f"Simple upload completed, media_id={media_id}")
            return media_id
        except requests.RequestException as e:
            logger.error(f"Simple upload request failed: {str(e)}")
            raise TweetPostError(f"Simple upload failed due to: {str(e)}")

    def _chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        logger.info(f"Starting chunked upload for {len(file_bytes)} bytes")
        media_id = self._init_chunked_upload(file_bytes, mime_type)
        self._append_chunked_upload(file_bytes, media_id)
        self._finalize_chunked_upload(media_id)
        logger.info(f"Chunked upload completed, media_id={media_id}")
        return media_id

    def _init_chunked_upload(self, file_bytes: bytes, mime_type: str) -> str:
        try:
            if not mime_type.startswith("video/"):
                logger.error(f"Invalid mime_type for chunked upload: {mime_type}")
                raise TweetPostError("Chunked upload only supported for video types.")
            params = {
                "command": "INIT",
                "media_type": mime_type,
                "total_bytes": len(file_bytes),
                "media_category": "tweet_video",
            }
            logger.debug("Sending INIT command for chunked upload")
            response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
            if response.status_code != 200:
                logger.error(f"INIT failed: {response.status_code} {response.text}")
                raise TweetPostError(f"INIT failed: {response.status_code} {response.text}")
            media_id = response.json().get("media_id_string")
            if not media_id:
                logger.error("INIT response missing media_id_string")
                raise TweetPostError("INIT response missing media id string.")
            logger.debug(f"INIT completed, media_id={media_id}")
            return media_id
        except requests.RequestException as e:
            logger.error(f"INIT request failed: {str(e)}")
            raise TweetPostError(f"INIT request failed: {str(e)}")

    def _append_chunked_upload(self, file_bytes: bytes, media_id: str) -> None:
        segment_index = 0
        total_segments = (len(file_bytes) + UPLOAD_CHUNK_SIZE - 1) // UPLOAD_CHUNK_SIZE
        for i in range(0, len(file_bytes), UPLOAD_CHUNK_SIZE):
            chunk = file_bytes[i: i + UPLOAD_CHUNK_SIZE]
            params = {"command": "APPEND", "media_id": media_id, "segment_index": segment_index}
            try:
                logger.debug(f"Uploading segment {segment_index + 1}/{total_segments}")
                response = requests.post(
                    self.upload_url,
                    headers={"Authorization": f"Bearer {self.api_bearer}"},
                    data=params,
                    files={"media": ("chunk", chunk, "application/octet-stream")},
                )
                if response.status_code not in (204, 202):
                    logger.error(f"APPEND failed at segment {segment_index}: {response.status_code}")
                    raise TweetPostError(
                        f"APPEND failed at segment {segment_index}: {response.status_code} {response.text}"
                    )
            except requests.RequestException as e:
                logger.error(f"APPEND request failed: {str(e)}")
                raise TweetPostError(f"APPEND request failed: {str(e)}")
            segment_index += 1
        logger.debug(f"All {total_segments} segments uploaded")

    def _finalize_chunked_upload(self, media_id: str) -> None:
        params = {"command": "FINALIZE", "media_id": media_id}
        try:
            logger.debug(f"Sending FINALIZE command for media_id={media_id}")
            response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
            if response.status_code not in (200, 201, 202):
                logger.error(f"FINALIZE failed: {response.status_code} {response.text}")
                raise TweetPostError(f"FINALIZE failed: {response.status_code} {response.text}")
            processing_info = response.json().get("processing_info")
            if not processing_info:
                logger.debug("FINALIZE completed immediately")
                return
            state = processing_info.get("state")
            if state == "succeeded":
                logger.debug("Video processing succeeded")
                return
            elif state == "failed":
                logger.error("Video processing failed after FINALIZE")
                raise TweetPostError("Video processing failed after FINALIZE.")
            check_after = processing_info.get("check_after_secs", 1)
            logger.debug(f"Video processing in progress, polling in {check_after}s")
            self._poll_status(media_id, check_after)
        except requests.RequestException as e:
            logger.error(f"FINALIZE request failed: {str(e)}")
            raise TweetPostError(f"FINALIZE request failed: {str(e)}")

    def _poll_status(self, media_id: str, initial_delay: int = 1) -> None:
        delay = initial_delay
        max_attempts = 20
        logger.debug(f"Starting status polling for media_id={media_id}")
        for i in range(max_attempts):
            time.sleep(delay)
            params = {"command": "STATUS", "media_id": media_id}
            try:
                response = requests.post(self.upload_url, headers={"Authorization": f"Bearer {self.api_bearer}"}, data=params)
                if response.status_code != 200:
                    logger.error(f"STATUS failed: {response.status_code} {response.text}")
                    raise TweetPostError(f"STATUS failed: {response.status_code} {response.text}")
                processing_info = response.json().get("processing_info", {})
                state = processing_info.get("state")
                logger.debug(f"Poll attempt {i + 1}/{max_attempts}: state={state}")
                if state == "succeeded":
                    logger.info("Video processing completed successfully")
                    return
                elif state == "failed":
                    logger.error("Video processing failed during STATUS polling")
                    raise TweetPostError("Video processing failed during STATUS polling.")
                delay = processing_info.get("check_after_secs", delay)
            except requests.RequestException as e:
                logger.error(f"STATUS request failed: {str(e)}")
                raise TweetPostError(f"STATUS request failed: {str(e)}")
        logger.error(f"Video processing timed out after {max_attempts} attempts")
        raise TweetPostError("Video processing timed out during STATUS polling.")
