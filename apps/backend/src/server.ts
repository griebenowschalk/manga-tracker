import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { xss } from 'express-xss-sanitizer';

dotenv.config();

//Routes
import authRouter from './routes/auth';

const app = express();

// Middleware
import asyncHandler from './middleware/async.middleware';
import errorHandler from './middleware/error.middleware';

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// Rate limiting
app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100,
  })
);

// Prevent HTTP param pollution
app.use(hpp());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Prevent XSS attacks
app.use(xss());

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })
);

// health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// TODO: mount routes
app.use('/api/v1/auth', authRouter);
// app.use('/api/search', searchRouter);

// Error handler
app.use(errorHandler);

// Async handler
app.use(asyncHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
