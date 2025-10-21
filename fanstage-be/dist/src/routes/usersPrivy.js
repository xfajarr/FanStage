import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { privyAuthMiddleware } from '../middleware/privyAuth.js';
import { PrivyClient } from '@privy-io/server-auth';
const privy = new PrivyClient(process.env.PRIVY_APP_ID || '', process.env.PRIVY_APP_SECRET || '');
const usersRouter = new Hono();
// Validation schemas
const updateProfileSchema = z.object({
    username: z.string().min(1).max(256).optional(),
    email: z.string().email().optional(),
    bio: z.string().max(1000).optional(),
    profileImageUrl: z.string().url().optional(),
    socialMediaLinks: z.string().max(1000).optional(),
});
const registerArtistSchema = z.object({
    artistCategory: z.enum(['senior_star', 'rising_star']),
    bio: z.string().max(1000).optional(),
    socialMediaLinks: z.string().max(1000).optional(),
    profileImageUrl: z.string().url().optional(),
});
// Get current user profile
usersRouter.get('/profile', privyAuthMiddleware, async (c) => {
    const user = c.get('user');
    // Try to update wallet address if it's still temporary
    if (user.walletAddress.startsWith('temp_') && user.privyDid) {
        try {
            console.log('🔄 Attempting to update wallet address for user:', user.privyDid);
            const privyUser = await privy.getUserById(user.privyDid);
            if (privyUser.linkedAccounts && privyUser.linkedAccounts.length > 0) {
                const walletAccount = privyUser.linkedAccounts.find((account) => account.type === 'wallet' && account.address);
                if (walletAccount && walletAccount.address) {
                    console.log('💳 Found real wallet address:', walletAccount.address);
                    // Update user in database
                    const [updatedUser] = await db
                        .update(users)
                        .set({ walletAddress: walletAccount.address })
                        .where(eq(users.privyDid, user.privyDid))
                        .returning();
                    console.log('✅ Updated user wallet address:', updatedUser.walletAddress);
                    return c.json({
                        user: {
                            walletAddress: updatedUser.walletAddress,
                            username: updatedUser.username,
                            email: updatedUser.email,
                            role: updatedUser.role,
                            bio: updatedUser.bio,
                            profileImageUrl: updatedUser.profileImagUrl,
                            artistCategory: updatedUser.artistCategory,
                            socialMediaLinks: updatedUser.socialMediaLinks,
                            createdAt: updatedUser.createdAt,
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('⚠️ Could not update wallet address:', error);
        }
    }
    return c.json({
        user: {
            walletAddress: user.walletAddress,
            username: user.username,
            email: user.email,
            role: user.role,
            bio: user.bio,
            profileImageUrl: user.profileImagUrl,
            artistCategory: user.artistCategory,
            socialMediaLinks: user.socialMediaLinks,
            createdAt: user.createdAt,
        }
    });
});
// Update user profile
usersRouter.put('/profile', privyAuthMiddleware, zValidator('json', updateProfileSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    // Remove undefined values
    const updateData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined));
    if (Object.keys(updateData).length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }
    try {
        const [updatedUser] = await db
            .update(users)
            .set({
            ...updateData,
            updatedAt: new Date(),
        })
            .where(eq(users.walletAddress, user.walletAddress))
            .returning();
        return c.json({
            message: 'Profile updated successfully',
            user: {
                walletAddress: updatedUser.walletAddress,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                bio: updatedUser.bio,
                profileImageUrl: updatedUser.profileImagUrl,
                artistCategory: updatedUser.artistCategory,
                socialMediaLinks: updatedUser.socialMediaLinks,
            }
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        if (error?.code === '23505') {
            return c.json({ error: 'Username or email already exists' }, 409);
        }
        return c.json({ error: 'Failed to update profile' }, 500);
    }
});
// Register as artist
usersRouter.post('/register-artist', privyAuthMiddleware, zValidator('json', registerArtistSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    if (user.role !== 'fan') {
        return c.json({ error: 'Only fans can register as artists' }, 400);
    }
    try {
        const [updatedUser] = await db
            .update(users)
            .set({
            role: 'artist',
            artistCategory: data.artistCategory,
            bio: data.bio || user.bio,
            socialMediaLinks: data.socialMediaLinks || user.socialMediaLinks,
            profileImagUrl: data.profileImageUrl || user.profileImagUrl,
            updatedAt: new Date(),
        })
            .where(eq(users.walletAddress, user.walletAddress))
            .returning();
        return c.json({
            message: 'Artist registration successful',
            user: {
                walletAddress: updatedUser.walletAddress,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                artistCategory: updatedUser.artistCategory,
                bio: updatedUser.bio,
                profileImageUrl: updatedUser.profileImagUrl,
                socialMediaLinks: updatedUser.socialMediaLinks,
            }
        });
    }
    catch (error) {
        console.error('Artist registration error:', error);
        return c.json({ error: 'Failed to register as artist' }, 500);
    }
});
// Link wallet address (for users who were created with temp addresses)
usersRouter.post('/link-wallet', privyAuthMiddleware, async (c) => {
    const user = c.get('user');
    const { walletAddress } = await c.req.json();
    if (!walletAddress || typeof walletAddress !== 'string') {
        return c.json({ error: 'Valid wallet address is required' }, 400);
    }
    // Check if wallet address is already in use
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress))
        .limit(1);
    if (existingUser.length > 0) {
        return c.json({ error: 'Wallet address is already linked to another account' }, 409);
    }
    try {
        const [updatedUser] = await db
            .update(users)
            .set({
            walletAddress,
            updatedAt: new Date(),
        })
            .where(eq(users.walletAddress, user.walletAddress))
            .returning();
        return c.json({
            message: 'Wallet address linked successfully',
            user: {
                walletAddress: updatedUser.walletAddress,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
            }
        });
    }
    catch (error) {
        console.error('Wallet linking error:', error);
        return c.json({ error: 'Failed to link wallet address' }, 500);
    }
});
export default usersRouter;
