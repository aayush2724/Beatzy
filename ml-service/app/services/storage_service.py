import os
import shutil
import tempfile
import structlog

logger = structlog.get_logger()

_USE_LOCAL = not os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID") == "your_aws_access_key"


def _storage_endpoint() -> str | None:
    return os.getenv("AWS_S3_ENDPOINT")


def check_storage_connectivity() -> dict:
    """Lightweight bucket reachability check for startup and /health."""
    bucket = os.getenv("AWS_S3_BUCKET", "beatzy-audio")
    endpoint = _storage_endpoint()

    if _USE_LOCAL:
        return {
            "mode": "local",
            "bucket": bucket,
            "reachable": True,
            "detail": "local filesystem storage",
        }

    try:
        import boto3
        from botocore.config import Config
        from botocore.exceptions import ClientError

        client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            endpoint_url=endpoint,
            config=Config(s3={"addressing_style": "path"}),
        )
        client.head_bucket(Bucket=bucket)
        return {
            "mode": "s3",
            "bucket": bucket,
            "endpoint": endpoint,
            "reachable": True,
        }
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.warning(
            "Storage bucket not reachable at startup",
            bucket=bucket,
            endpoint=endpoint,
            error_code=code,
            error=str(e),
        )
        return {
            "mode": "s3",
            "bucket": bucket,
            "endpoint": endpoint,
            "reachable": False,
            "error": code,
        }
    except Exception as e:
        logger.warning(
            "Storage connectivity check failed",
            bucket=bucket,
            endpoint=endpoint,
            error=str(e),
        )
        return {
            "mode": "s3",
            "bucket": bucket,
            "endpoint": endpoint,
            "reachable": False,
            "error": str(e),
        }


class StorageService:
    def __init__(self):
        self.endpoint = _storage_endpoint()
        if not _USE_LOCAL:
            import boto3
            from botocore.config import Config

            # Path-style required for Supabase, MinIO, R2
            self.s3 = boto3.client(
                "s3",
                region_name=os.getenv("AWS_REGION", "us-east-1"),
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                endpoint_url=self.endpoint,
                config=Config(s3={"addressing_style": "path"}),
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

        local_storage = os.getenv("LOCAL_STORAGE_DIR", "/tmp/beatzy-audio")
        local_path = os.path.join(local_storage, s3_key)

        if _USE_LOCAL or os.path.exists(local_path):
            if os.path.exists(local_path):
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=f"beatzy_{job_id}_")
                tmp.close()
                shutil.copy2(local_path, tmp.name)
                logger.info("Copied local file for analysis", key=s3_key, path=tmp.name)
                return tmp.name
            raise FileNotFoundError(
                f"Local audio file not found: {local_path} (key={s3_key!r})"
            )

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, prefix=f"beatzy_{job_id}_")
        try:
            self.s3.download_fileobj(Bucket=self.bucket, Key=s3_key, Fileobj=tmp)
            tmp.close()
            logger.info(
                "Downloaded from S3",
                key=s3_key,
                bucket=self.bucket,
                endpoint=self.endpoint,
                path=tmp.name,
            )
            return tmp.name
        except Exception as e:
            tmp.close()
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
            from botocore.exceptions import ClientError

            err_detail = str(e)
            if isinstance(e, ClientError):
                err_detail = e.response.get("Error", {}).get("Message", err_detail)
            logger.error(
                "S3 download failed",
                key=s3_key,
                bucket=self.bucket,
                endpoint=self.endpoint,
                job_id=job_id,
                error=err_detail,
            )
            raise FileNotFoundError(
                f"S3 download failed for key={s3_key!r} bucket={self.bucket!r} endpoint={self.endpoint!r}: {err_detail}"
            ) from e

    def cleanup(self, path: str):
        try:
            os.unlink(path)
        except Exception:
            pass
