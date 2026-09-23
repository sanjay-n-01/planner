import cors from 'cors';
import express from 'express';
import stateRouter from './routes/state.route.js';

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/state', stateRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
