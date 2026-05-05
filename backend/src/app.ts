// Main Express Application
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeEmailTransporter } from './services/emailService.js';
import { csrfTokenMiddleware } from './middleware/csrf.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Frontend origin for CORS and CSP
const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Security middleware with Content Security Policy
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", frontendOrigin],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", frontendOrigin, "https://*.supabase.co", "https://openrouter.ai"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for some integrations
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cookie parser (required for CSRF)
app.use(cookieParser());

// CORS configuration
app.use(cors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-user-id']
}));

// CSRF token middleware (sets token on GET requests)
app.use(csrfTokenMiddleware);

const rateLimitMessage = {
    success: false,
    message: 'Too many requests, please try again shortly'
};

const createLimiter = (windowMs: number, max: number) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitMessage,
    skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
});

// The web app now hydrates several backend-owned panels in parallel and the
// browser extension can sync health/session state at the same time. Keep the
// global API limit high enough for normal app usage, then protect sensitive
// write-heavy endpoints with narrower route-specific limits.
app.use('/api', createLimiter(
    Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 1500 : 5000))
));
app.use('/api/auth', createLimiter(15 * 60 * 1000, Number(process.env.AUTH_RATE_LIMIT_MAX || 120)));
app.use('/api/settings/security', createLimiter(15 * 60 * 1000, Number(process.env.SECURITY_RATE_LIMIT_MAX || 60)));
app.use('/api/settings/data', createLimiter(15 * 60 * 1000, Number(process.env.SECURITY_RATE_LIMIT_MAX || 60)));
app.use('/api/reset', createLimiter(15 * 60 * 1000, Number(process.env.SECURITY_RATE_LIMIT_MAX || 60)));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (production debugging)
app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use(errorHandler);

// Start server
// Export for server.ts and Vercel
export default app;


