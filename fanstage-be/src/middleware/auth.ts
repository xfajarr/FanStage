import type { Context, Next } from 'hono';
import { verify, sign } from 'hono/jwt';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface JWTPayload {
  walletAddress: string;
  role: string;
  exp?: number;
}

// Extend Hono context type
declare module 'hono' {
  interface ContextVariableMap {
    user: typeof users.$inferSelect;
    walletAddress: string;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = await verify(token, process.env.JWT_SECRET!) as unknown as JWTPayload;
    
    // Fetch user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.walletAddress, decoded.walletAddress))
      .limit(1);
    
    if (!user.length) {
      return c.json({ error: 'Unauthorized - User not found' }, 401);
    }

    // Add user to context
    c.set('user', user[0]);
    c.set('walletAddress', decoded.walletAddress);
    
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Generate JWT token using Hono's sign function
export async function generateToken(walletAddress: string, role: string): Promise<string> {
  const payload = {
    walletAddress,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  
  return await sign(payload, process.env.JWT_SECRET!);
}

export async function artistMiddleware(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user || (user.role !== 'artist' && user.role !== 'agency')) {
    return c.json({ error: 'Forbidden - Artist access required' }, 403);
  }
  
  await next();
}