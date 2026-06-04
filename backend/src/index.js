require('dotenv').config();
require('express-async-errors');

// Basic environment validation
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Warn about important optional vars
  const optional = ['STRIPE_SECRET_KEY', 'AWS_ACCESS_KEY_ID', 'ACOUSTID_API_KEY'];
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
}

validateEnv();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./utils/logger');
const { connectDB } = require('./db/client');
const { connectRedis } = require('./db/redis');
const { initIO } = require('./db/socketio');
const { initQueue } = require('./services/queue');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { idempotency } = require('./middleware/idempotency');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const passport = require('passport');
const authRoutes = require('./routes/auth');
const audioRoutes = require('./routes/audio');
const resultRoutes = require('./routes/results');
const keyRoutes = require('./routes/apiKeys');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const libraryRoutes = require('./routes/library');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const isDev = process.env.NODE_ENV !== 'production';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(cors({
  origin: isDev ? true : function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL?.trim().replace(/^["']|["']$/g, '') || 'http://localhost:5173',
      process.env.BACKEND_URL?.trim().replace(/^["']|["']$/g, ''), // For same-origin requests
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000'
    ].filter(Boolean);
    
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    callback(null, isAllowed);
  },
  credentials: true,
}));

app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(idempotency);
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'beatzy-backend', timestamp: new Date().toISOString() });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Beatzy API Documentation',
}));

app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/library', libraryRoutes);

app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();
    await initQueue();
    initIO(server);

    server.listen(PORT, () => {
      logger.info(`Beatzy backend running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Kill the process with: fuser -k ${PORT}/tcp`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    if (process.env.NODE_ENV !== 'test') {
      const { redisAvailable } = require('./db/redis');
      if (redisAvailable) {
        try {
          require('./workers/analysisWorker');
          logger.info('Analysis worker started (BullMQ)');
        } catch (err) {
          logger.warn('Analysis worker could not start', { error: err.message });
        }
      } else {
        logger.info('Redis unavailable — jobs will be processed inline');
      }
    }
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

module.exports = { app, server };
