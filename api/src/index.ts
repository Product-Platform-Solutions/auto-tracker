import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { eventRouter } from './routes/events';
import { healthRouter } from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/events', eventRouter);

app.listen(PORT, () => {
  console.log(`🚀 Auto-Tracker API running on port ${PORT}`);
});

export default app;
