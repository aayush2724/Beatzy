require('dotenv').config();
require('express-async-errors');

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

const authRoutes = require('./routes/auth');
const audioRoutes = require('./routes/audio');
const resultRoutes = require('./routes/results');
const keyRoutes = require('./routes/apiKeys');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const isDev = process.env.NODE_ENV !== 'production';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

app.use(cors({
  origin: isDev ? true : (process.env.FRONTEND_URL || 'http://localhost:5000').trim().replace(/^["']|["']$/g, ''),
  credentials: true,
}));

app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(idempotency);

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
