import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interview.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/interview', interviewRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'Ayush Setu TypeScript API' });
});

app.listen(port, () => {
  console.log(`Ayush Setu (आयुष सेतु) Server listening on port ${port}`);
});

