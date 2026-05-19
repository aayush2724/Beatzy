import os
import tempfile
import boto3
import structlog

logger = structlog.get_logger()


class StorageService:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.bucket = os.getenv("AWS_S3_BUCKET", "beatzy-audio")

    async def download_from_s3(self, s3_key: str, job_id: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._download_sync, s3_key, job_id)

    def _download_sync(self, s3_key: str, job_id: str) -> str:
        suffix = os.path.splitext(s3_key)[1] or ".mp3"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=f"beatzy_{job_id}_")
        self.s3.download_fileobj(self.bucket, s3_key, tmp)
        tmp.close()
        logger.info("Downloaded from S3", key=s3_key, path=tmp.name)
        return tmp.name

    def cleanup(self, path: str):
        try:
            os.unlink(path)
        except Exception:
            pass
