import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'aqllimahalla_dev_secret_key_2026_secure';

export type RoleName = 'super_admin' | 'mahalla_raisi' | 'masul_xodim' | 'fuqaro';

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatar_url: string;
  address: string;
  house_number: string;
  extra_info: string;
  profile_completed: number;
  is_active: number;
  roles: RoleName[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function getUserWithRoles(userId: number): AuthUser | null {
  const user = db
    .prepare(
      `SELECT id, COALESCE(username, '') as username, first_name, last_name,
              COALESCE(phone, '') as phone, COALESCE(email, '') as email,
              avatar_url, address, COALESCE(house_number, '') as house_number,
              COALESCE(extra_info, '') as extra_info,
              COALESCE(profile_completed, 0) as profile_completed,
              is_active
       FROM users WHERE id = ?`
    )
    .get(userId) as Omit<AuthUser, 'roles'> | undefined;

  if (!user) return null;

  const roleRows = db
    .prepare(
      `SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`
    )
    .all(userId) as { name: RoleName }[];

  return {
    ...user,
    roles: roleRows.map((r) => r.name),
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
      const user = getUserWithRoles(Number(payload.sub));
      if (user && user.is_active) {
        req.user = user;
      }
    } catch {
      // ignore invalid optional token
    }
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as { sub: number };
    const user = getUserWithRoles(Number(payload.sub));
    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Hisobingiz bloklangan' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
}

export function requireRoles(allowed: RoleName[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }
    const hasRole = req.user.roles.some((r) => allowed.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: 'Ushbu amalni bajarish uchun ruxsatingiz yo‘q' });
    }
    next();
  };
}

export const isStaff = (user?: AuthUser | null) =>
  Boolean(user?.roles.some((r) => ['super_admin', 'mahalla_raisi', 'masul_xodim'].includes(r)));

export const isAdmin = (user?: AuthUser | null) =>
  Boolean(user?.roles.some((r) => ['super_admin', 'mahalla_raisi'].includes(r)));
