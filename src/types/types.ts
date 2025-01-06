import { JwtPayload as JWT } from 'jsonwebtoken';

export interface DecodedToken {
  valid: boolean;
  expired: boolean;
  decoded: JWT | null;
}

export interface RequestUser extends Request {
  user?: { id: string };
}
