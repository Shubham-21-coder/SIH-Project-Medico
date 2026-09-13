import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import interviewRoutes from './routes/interview.js';
import authRoutes from './routes/auth.js';
import abhaRoutes from './routes/abha.js';


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/interview', interviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/abha', abhaRoutes);


app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'Ayush Setu TypeScript API' });
});

app.listen(port, () => {
  console.log(`Ayush Setu (आयुष सेतु) Server listening on port ${port}`);
});

