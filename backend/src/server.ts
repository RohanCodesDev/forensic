import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import emailRoutes from './routes/email.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Forensic Mail API is running! Visit /api/health to check status.');
});
app.use('/api', healthRoutes);
app.use('/api/emails', emailRoutes);

// Start Server locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;
