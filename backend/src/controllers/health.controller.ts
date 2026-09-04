import { Request, Response } from 'express';

export const checkHealth = (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Backend is running perfectly!',
    timestamp: new Date().toISOString()
  });
};
