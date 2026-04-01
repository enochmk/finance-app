import type { Users } from '../../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<Users, 'id' | 'email' | 'name' | 'currency'>;
    }
  }
}

export {};
