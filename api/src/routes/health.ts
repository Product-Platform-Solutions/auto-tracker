import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'auto-tracker-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
