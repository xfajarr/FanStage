import { Hono } from 'hono';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { userSchema } from '../validators/index.js';
import { eq, and } from 'drizzle-orm';
const usersRouter = new Hono();
// Login/Register with Privy wallet
usersRouter.post('/login', async (c) => {
    try {
        const { walletAddress, username, email } = await c.req.json();
        if (!walletAddress || !username) {
            return c.json({ error: 'Wallet address and username are required' }, 400);
        }
        // Check if user exists
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.walletAddress, walletAddress))
            .limit(1);
        let user;
        if (existingUser.length === 0) {
            // Create new user
            const newUser = {
                walletAddress,
                username,
                email: email || null,
                role: 'fan',
            };
            const [createdUser] = await db.insert(users)
                .values(newUser)
                .returning();
            user = createdUser;
        }
        else {
            user = existingUser[0];
        }
        // Generate JWT token
        const token = await generateToken(user.walletAddress, user.role);
        return c.json({
            user: {
                id: user.walletAddress,
                walletAddress: user.walletAddress,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
                profileImageUrl: user.profileImagUrl,
                socialMediaLinks: user.socialMediaLinks,
                artistCategory: user.artistCategory,
                createdAt: user.createdAt,
            },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get current user profile
usersRouter.get('/profile', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        return c.json({
            id: user.walletAddress,
            walletAddress: user.walletAddress,
            username: user.username,
            email: user.email,
            role: user.role,
            bio: user.bio,
            profileImageUrl: user.profileImagUrl,
            socialMediaLinks: user.socialMediaLinks,
            artistCategory: user.artistCategory,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Update user profile
usersRouter.put('/profile', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        // Validate input
        const validatedData = userSchema.parse(body);
        // Update user
        const [updatedUser] = await db.update(users)
            .set({
            ...validatedData,
            updatedAt: new Date(),
        })
            .where(eq(users.walletAddress, user.walletAddress))
            .returning();
        return c.json({
            id: updatedUser.walletAddress,
            walletAddress: updatedUser.walletAddress,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            bio: updatedUser.bio,
            profileImageUrl: updatedUser.profileImagUrl,
            socialMediaLinks: updatedUser.socialMediaLinks,
            artistCategory: updatedUser.artistCategory,
            updatedAt: updatedUser.updatedAt,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Register as artist
usersRouter.post('/register-artist', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const { artistCategory, bio, socialMediaLinks } = await c.req.json();
        if (!artistCategory || !['senior_star', 'rising_star'].includes(artistCategory)) {
            return c.json({ error: 'Invalid artist category' }, 400);
        }
        // Update user to artist role
        const [updatedUser] = await db.update(users)
            .set({
            role: 'artist',
            artistCategory,
            bio: bio || null,
            socialMediaLinks: socialMediaLinks || null,
            updatedAt: new Date(),
        })
            .where(eq(users.walletAddress, user.walletAddress))
            .returning();
        return c.json({
            id: updatedUser.walletAddress,
            walletAddress: updatedUser.walletAddress,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            bio: updatedUser.bio,
            profileImageUrl: updatedUser.profileImagUrl,
            socialMediaLinks: updatedUser.socialMediaLinks,
            artistCategory: updatedUser.artistCategory,
            updatedAt: updatedUser.updatedAt,
        });
    }
    catch (error) {
        console.error('Register artist error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get user by wallet address
usersRouter.get('/:walletAddress', async (c) => {
    try {
        const walletAddress = c.req.param('walletAddress');
        const [user] = await db.select()
            .from(users)
            .where(eq(users.walletAddress, walletAddress))
            .limit(1);
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json({
            id: user.walletAddress,
            walletAddress: user.walletAddress,
            username: user.username,
            role: user.role,
            bio: user.bio,
            profileImageUrl: user.profileImagUrl,
            socialMediaLinks: user.socialMediaLinks,
            artistCategory: user.artistCategory,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
export default usersRouter;
