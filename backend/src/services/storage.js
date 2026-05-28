const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

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

const s3 = new S3Client(s3Config);

const BUCKET = process.env.AWS_S3_BUCKET || 'beatzy-audio';

async function uploadToS3(buffer, key, contentType) {
  const uploadParams = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  // Only apply server side encryption for real AWS S3
  if (!process.env.AWS_S3_ENDPOINT) {
    uploadParams.ServerSideEncryption = 'AES256';
  }

  const cmd = new PutObjectCommand(uploadParams);
  await s3.send(cmd);

  // Generate appropriate URL format depending on whether local MinIO is used
  const url = process.env.AWS_S3_ENDPOINT
    ? `${process.env.AWS_S3_ENDPOINT}/${BUCKET}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  logger.info('File uploaded successfully', { key, size: buffer.length, url });
  return url;
}

async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.info('File deleted from S3', { key });
}

async function getPresignedUrl(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

module.exports = { uploadToS3, deleteFromS3, getPresignedUrl };
