const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || '/tmp/beatzy-audio';
const useLocalStorage = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key';

let s3 = null;
let publicS3 = null;
const BUCKET = process.env.AWS_S3_BUCKET || 'beatzy-audio';

// AWS_S3_ENDPOINT is how *this service* reaches storage (e.g. http://minio:9000
// inside Docker). AWS_S3_PUBLIC_ENDPOINT is how a *browser* reaches it. They
// differ in container setups, and a presigned URL is only valid for the host it
// was signed against — so URLs handed to clients need their own client.
const PUBLIC_ENDPOINT = process.env.AWS_S3_PUBLIC_ENDPOINT || process.env.AWS_S3_ENDPOINT;

function buildS3Client(endpoint) {
  const { S3Client } = require('@aws-sdk/client-s3');
  const s3Config = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  if (endpoint) {
    s3Config.endpoint = endpoint;
    s3Config.forcePathStyle = true;
  }
  return new S3Client(s3Config);
}

function getS3() {
  if (!s3) s3 = buildS3Client(process.env.AWS_S3_ENDPOINT);
  return s3;
}

function getPublicS3() {
  if (PUBLIC_ENDPOINT === process.env.AWS_S3_ENDPOINT) return getS3();
  if (!publicS3) publicS3 = buildS3Client(PUBLIC_ENDPOINT);
  return publicS3;
}

function ensureLocalDir(key) {
  const fullPath = path.join(LOCAL_STORAGE_DIR, key);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  return fullPath;
}

async function uploadToS3(buffer, key, contentType) {
  if (useLocalStorage) {
    const fullPath = ensureLocalDir(key);
    fs.writeFileSync(fullPath, buffer);
    logger.info('File stored locally', { key, path: fullPath });
    return fullPath;
  }

  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };
  if (!process.env.AWS_S3_ENDPOINT) {
    params.ServerSideEncryption = 'AES256';
  }
  await getS3().send(new PutObjectCommand(params));

  const url = PUBLIC_ENDPOINT
    ? `${PUBLIC_ENDPOINT}/${BUCKET}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  logger.info('File uploaded to S3', { key, bucket: BUCKET, contentType, endpoint: process.env.AWS_S3_ENDPOINT || 'aws' });
  return url;
}

async function deleteFromS3(key) {
  if (useLocalStorage) {
    try {
      const fullPath = path.join(LOCAL_STORAGE_DIR, key);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (e) {
      /* ignore */
    }
    return;
  }
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.info('Deleted object from storage', { key, bucket: BUCKET });
}

async function getPresignedUrl(key, expiresIn = 3600) {
  if (useLocalStorage) {
    const fullPath = path.join(LOCAL_STORAGE_DIR, key);
    if (!fs.existsSync(fullPath)) throw new Error('File not found');
    return `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/audio/file/${encodeURIComponent(key)}`;
  }
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(getPublicS3(), cmd, { expiresIn });
}

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl, useLocalStorage, LOCAL_STORAGE_DIR };
