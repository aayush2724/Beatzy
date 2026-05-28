require('dotenv').config();
require('express-async-errors');

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createBullBoard } = require('@bull-board/api');

const logger = require('./utils/logger');
const { connectDB } = require('./db/client');
const { connectRedis } = require('./db/redis');
const { initIO } = require('./db/socketio');
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

app.use(helmet());
app.use(compression());
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrl = rawFrontendUrl.trim().replace(/^["']|["']$/g, '');

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Idempotency guard for mutating requests
app.use(idempotency);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'beatzy-backend', timestamp: new Date().toISOString() });
});

// Interactive API documentation
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
    initIO(server);
    server.listen(PORT, () => {
      logger.info(`Beatzy backend running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

// Only bootstrap when this file is run directly, not when required by tests
if (require.main === module) {
  bootstrap();
}

module.exports = { app, server };
