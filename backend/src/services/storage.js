const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || '/tmp/beatzy-audio';
const useLocalStorage = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'your_aws_access_key';

let s3 = null;
const BUCKET = process.env.AWS_S3_BUCKET || 'beatzy-audio';

function getS3() {
  if (s3) return s3;
  const { S3Client } = require('@aws-sdk/client-s3');
  const s3Config = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  if (process.env.AWS_S3_ENDPOINT) {
    s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
    s3Config.forcePathStyle = true;
  }
  s3 = new S3Client(s3Config);
  return s3;
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

  const url = process.env.AWS_S3_ENDPOINT
    ? `${process.env.AWS_S3_ENDPOINT}/${BUCKET}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  logger.info('File uploaded to S3', { key, url });
  return url;
}

async function deleteFromS3(key) {
  if (useLocalStorage) {
    try {
      const fullPath = path.join(LOCAL_STORAGE_DIR, key);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {}
    return;
  }
  const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
  await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

async function getPresignedUrl(key, expiresIn = 3600) {
  if (useLocalStorage) {
    return path.join(LOCAL_STORAGE_DIR, key);
  }
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(getS3(), cmd, { expiresIn });
}

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl, useLocalStorage, LOCAL_STORAGE_DIR };
