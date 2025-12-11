import { Request } from 'express';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      cookies?: any;
      user?: JwtUser;
    }
  }
}
