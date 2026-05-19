const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'beatzy-audio';

async function uploadToS3(buffer, key, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  await s3.send(cmd);
  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  logger.info('File uploaded to S3', { key, size: buffer.length });
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
