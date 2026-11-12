import type { SchoolScope, TokenUser } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth. */
      user?: TokenUser;
      /** Set by schoolScope. */
      scope?: SchoolScope;
    }
  }
}
