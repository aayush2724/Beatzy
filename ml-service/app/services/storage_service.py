import os
import shutil
import tempfile
import structlog

logger = structlog.get_logger()

_USE_LOCAL = not os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID") == "your_aws_access_key"


class StorageService:
    def __init__(self):
        if not _USE_LOCAL:
            import boto3
            from botocore.config import Config

            endpoint_url = os.getenv("AWS_S3_ENDPOINT")
            # Path-style addressing required for Cloudflare R2 and MinIO
            s3_config = Config(signature_version="s3v4", s3={"addressing_style": "path"})
            self.s3 = boto3.client(
                "s3",
                region_name=os.getenv("AWS_REGION", "us-east-1"),
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                endpoint_url=endpoint_url,
                config=s3_config,
            )
            self.bucket = os.getenv("AWS_S3_BUCKET", "beatzy-audio")
        else:
            self.s3 = None
            self.bucket = None

    async def download_from_s3(self, s3_key: str, job_id: str) -> str:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._download_sync, s3_key, job_id)

    def _download_sync(self, s3_key: str, job_id: str) -> str:
        suffix = os.path.splitext(s3_key)[1] or ".mp3"

        # If s3_url is actually a local filesystem path, just copy it to a temp file
        local_storage = os.getenv("LOCAL_STORAGE_DIR", "/tmp/beatzy-audio")
        local_path = os.path.join(local_storage, s3_key)

        if _USE_LOCAL or os.path.exists(local_path):
            if os.path.exists(local_path):
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=f"beatzy_{job_id}_")
                tmp.close()
                shutil.copy2(local_path, tmp.name)
                logger.info("Copied local file for analysis", key=s3_key, path=tmp.name)
                return tmp.name
            else:
                raise FileNotFoundError(f"Local audio file not found: {local_path}")

        # S3 download
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
