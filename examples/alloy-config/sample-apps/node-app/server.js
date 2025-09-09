// Sample Node.js Application for Grafana Alloy POC
// This application demonstrates metrics, tracing, and logging integration

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Prometheus metrics
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// OpenTelemetry setup
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const opentelemetry = require('@opentelemetry/api');

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  port: process.env.PORT || 3000,
  serviceName: process.env.SERVICE_NAME || 'sample-node-app',
  serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318',
  metricsEnabled: process.env.METRICS_ENABLED === 'true' || true,
  tracingEnabled: process.env.TRACING_ENABLED === 'true' || true,
  logLevel: process.env.LOG_LEVEL || 'info'
};

// =============================================================================
// LOGGING SETUP
// =============================================================================

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: config.serviceName,
    version: config.serviceVersion,
    environment: config.environment
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// =============================================================================
// OPENTELEMETRY SETUP
// =============================================================================

if (config.tracingEnabled) {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${config.otlpEndpoint}/v1/traces`,
    }),
    metricExporter: new OTLPMetricExporter({
      url: `${config.otlpEndpoint}/v1/metrics`,
    }),
    instrumentations: [getNodeAutoInstrumentations()]
  });
  
  sdk.start();
  logger.info('OpenTelemetry initialized successfully');
}

// =============================================================================
// PROMETHEUS METRICS SETUP
// =============================================================================

if (config.metricsEnabled) {
  // Collect default metrics
  collectDefaultMetrics({ prefix: 'nodejs_' });
  
  // Custom metrics
  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  });
  
  const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });
  
  const activeConnections = new promClient.Gauge({
    name: 'http_active_connections',
    help: 'Number of active HTTP connections',
  });
  
  const businessMetrics = {
    userActions: new promClient.Counter({
      name: 'user_actions_total',
      help: 'Total number of user actions',
      labelNames: ['action_type', 'user_id']
    }),
    
    dataProcessed: new promClient.Counter({
      name: 'data_processed_bytes_total',
      help: 'Total bytes of data processed',
      labelNames: ['operation_type']
    }),
    
    cacheHits: new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type']
    }),
    
    cacheMisses: new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type']
    })
  };
  
  // Export metrics for external access
  global.metrics = {
    httpRequestDuration,
    httpRequestsTotal,
    activeConnections,
    businessMetrics
  };
}

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Metrics middleware
if (config.metricsEnabled) {
  app.use((req, res, next) => {
    const start = Date.now();
    global.metrics.activeConnections.inc();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route ? req.route.path : req.path;
      
      global.metrics.httpRequestDuration
        .labels(req.method, route, res.statusCode)
        .observe(duration);
      
      global.metrics.httpRequestsTotal
        .labels(req.method, route, res.statusCode)
        .inc();
      
      global.metrics.activeConnections.dec();
    });
    
    next();
  });
}

// Logging middleware
app.use((req, res, next) => {
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  const span = opentelemetry.trace.getActiveSpan();
  if (span) {
    span.setAttributes({
      'http.route': '/health',
      'app.request_id': req.id
    });
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: config.serviceName,
    version: config.serviceVersion,
    environment: config.environment,
    requestId: req.id
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  if (!config.metricsEnabled) {
    return res.status(404).json({ error: 'Metrics disabled' });
  }
  
  try {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// User simulation endpoints
app.get('/api/users', (req, res) => {
  const span = opentelemetry.trace.getActiveSpan();
  if (span) {
    span.setAttributes({
      'http.route': '/api/users',
      'app.request_id': req.id,
      'app.operation': 'list_users'
    });
  }
  
  // Simulate some business logic
  if (config.metricsEnabled) {
    global.metrics.businessMetrics.userActions.labels('list', 'anonymous').inc();
    global.metrics.businessMetrics.dataProcessed.labels('user_query').inc(1024);
    
    // Simulate cache hit/miss
    const cacheHit = Math.random() > 0.3;
    if (cacheHit) {
      global.metrics.businessMetrics.cacheHits.labels('user_cache').inc();
    } else {
      global.metrics.businessMetrics.cacheMisses.labels('user_cache').inc();
    }
  }
  
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    active: Math.random() > 0.2
  }));
  
  logger.info('Users listed', { count: users.length, requestId: req.id });
  res.json({ users, requestId: req.id });
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const span = opentelemetry.trace.getActiveSpan();
  
  if (span) {
    span.setAttributes({
      'http.route': '/api/users/:id',
      'app.request_id': req.id,
      'app.user_id': userId,
      'app.operation': 'get_user'
    });
  }
  
  if (config.metricsEnabled) {
    global.metrics.businessMetrics.userActions.labels('get', userId).inc();
    global.metrics.businessMetrics.dataProcessed.labels('user_detail').inc(512);
  }
  
  // Simulate user not found
  if (userId === '404') {
    logger.warn('User not found', { userId, requestId: req.id });
    return res.status(404).json({ error: 'User not found', requestId: req.id });
  }
  
  // Simulate server error
  if (userId === '500') {
    logger.error('Internal server error', { userId, requestId: req.id });
    return res.status(500).json({ error: 'Internal server error', requestId: req.id });
  }
  
  const user = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    active: true,
    profile: {
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      bio: `This is user ${userId}'s bio`,
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
  
  logger.info('User retrieved', { userId, requestId: req.id });
  res.json({ user, requestId: req.id });
});

// Slow endpoint for testing
app.get('/api/slow', async (req, res) => {
  const delay = parseInt(req.query.delay) || 2000;
  const span = opentelemetry.trace.getActiveSpan();
  
  if (span) {
    span.setAttributes({
      'http.route': '/api/slow',
      'app.request_id': req.id,
      'app.delay_ms': delay
    });
  }
  
  logger.info('Slow endpoint called', { delay, requestId: req.id });
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.json({
    message: `Delayed response after ${delay}ms`,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// Data processing endpoint
app.post('/api/process', (req, res) => {
  const data = req.body;
  const span = opentelemetry.trace.getActiveSpan();
  
  if (span) {
    span.setAttributes({
      'http.route': '/api/process',
      'app.request_id': req.id,
      'app.data_size': JSON.stringify(data).length
    });
  }
  
  if (config.metricsEnabled) {
    global.metrics.businessMetrics.dataProcessed
      .labels('data_processing')
      .inc(JSON.stringify(data).length);
  }
  
  // Simulate processing
  const processed = {
    ...data,
    processed: true,
    processedAt: new Date().toISOString(),
    processingTime: Math.random() * 1000
  };
  
  logger.info('Data processed', {
    dataSize: JSON.stringify(data).length,
    requestId: req.id
  });
  
  res.json({ result: processed, requestId: req.id });
});

// Error endpoint for testing
app.get('/api/error', (req, res) => {
  const errorType = req.query.type || 'generic';
  
  logger.error('Intentional error triggered', { errorType, requestId: req.id });
  
  switch (errorType) {
    case 'timeout':
      // Don't respond to simulate timeout
      break;
    case 'crash':
      throw new Error('Application crash simulation');
    default:
      res.status(500).json({
        error: 'Simulated error',
        type: errorType,
        requestId: req.id
      });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: config.serviceName,
    version: config.serviceVersion,
    environment: config.environment,
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      users: '/api/users',
      user: '/api/users/:id',
      slow: '/api/slow?delay=2000',
      process: 'POST /api/process',
      error: '/api/error?type=generic'
    },
    requestId: req.id
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', { path: req.originalUrl, requestId: req.id });
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    requestId: req.id
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    requestId: req.id
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    requestId: req.id
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(config.port, () => {
  logger.info('Server started', {
    port: config.port,
    serviceName: config.serviceName,
    version: config.serviceVersion,
    environment: config.environment,
    metricsEnabled: config.metricsEnabled,
    tracingEnabled: config.tracingEnabled
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;