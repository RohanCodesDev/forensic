import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import emailRoutes from './routes/email.routes';
import campaignRoutes from './routes/campaign.routes';
import { globalErrorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Forensic Mail API is running! Visit /api/health to check status.');
});
app.use('/api', healthRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/campaigns', campaignRoutes);

// Apply Global Error Handler (must be the last middleware)
app.use(globalErrorHandler);

// Start Server locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;
