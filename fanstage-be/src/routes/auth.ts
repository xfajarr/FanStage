import { Hono } from 'hono';
import { privyAuthMiddleware } from '../middleware/privyAuth.js';

const authRoutes = new Hono();

// Get authentication status
authRoutes.get('/status', privyAuthMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    authenticated: true,
    user: {
      privyDid: user.privyDid,
      walletAddress: user.walletAddress,
      username: user.username,
      email: user.email,
      role: user.role,
      artistCategory: user.artistCategory,
      bio: user.bio,
      profileImagUrl: user.profileImagUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    timestamp: new Date().toISOString()
  });
});

// Public endpoint to check if backend is accessible
authRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

export { authRoutes };