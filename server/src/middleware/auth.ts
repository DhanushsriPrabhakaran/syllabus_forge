import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@syllabusforge/shared';
import { User } from '../models/User.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'syllabusforge-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    department: string;
    programmeAccess: string[];
    name: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      department: user.department,
      programmeAccess: user.programmeAccess,
      name: user.name,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
