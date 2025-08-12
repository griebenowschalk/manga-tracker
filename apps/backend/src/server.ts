import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

dotenv.config();

//Routes
// import auth from './routes/auth';

const app = express();

// // Middleware
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

app.use(helmet());
app.use(express.json());
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
// app.use('/api/auth', authRouter);
// app.use('/api/search', searchRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
