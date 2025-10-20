import { Hono } from 'hono';
import { authMiddleware, artistMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { campaignUpdates, campaigns, users } from '../db/schema.js';
import { campaignUpdateSchema } from '../validators/index.js';
import { eq, and, desc } from 'drizzle-orm';
const updatesRouter = new Hono();
// Get campaign updates
updatesRouter.get('/campaign/:id', async (c) => {
    try {
        const campaignId = parseInt(c.req.param('id'));
        const { page = '1', limit = '10' } = c.req.query();
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const updates = await db
            .select({
            id: campaignUpdates.id,
            campaignId: campaignUpdates.campaignId,
            updateTitle: campaignUpdates.updateTitle,
            content: campaignUpdates.content,
            mediaUrl: campaignUpdates.mediaUrl,
            createdAt: campaignUpdates.createdAt,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
        })
            .from(campaignUpdates)
            .leftJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .where(eq(campaignUpdates.campaignId, campaignId))
            .orderBy(desc(campaignUpdates.createdAt))
            .limit(parseInt(limit))
            .offset(offset);
        return c.json({
            updates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: updates.length,
            },
        });
    }
    catch (error) {
        console.error('Get campaign updates error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Create campaign update (artist only)
updatesRouter.post('/campaign/:id', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const campaignId = parseInt(c.req.param('id'));
        const body = await c.req.json();
        // Validate input
        const validatedData = campaignUpdateSchema.parse(body);
        // Check if campaign exists and belongs to user
        const [campaign] = await db.select()
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.artistId, user.walletAddress)))
            .limit(1);
        if (!campaign) {
            return c.json({ error: 'Campaign not found or access denied' }, 404);
        }
        // Create campaign update
        const [newUpdate] = await db.insert(campaignUpdates)
            .values({
            campaignId,
            updateTitle: validatedData.updateTitle,
            content: validatedData.content,
            mediaUrl: validatedData.mediaUrl || null,
        })
            .returning();
        return c.json({
            id: newUpdate.id,
            campaignId: newUpdate.campaignId,
            updateTitle: newUpdate.updateTitle,
            content: newUpdate.content,
            mediaUrl: newUpdate.mediaUrl,
            createdAt: newUpdate.createdAt,
            artistName: user.username,
            artistAvatar: user.profileImagUrl,
        });
    }
    catch (error) {
        console.error('Create campaign update error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get single update by ID
updatesRouter.get('/:id', async (c) => {
    try {
        const updateId = parseInt(c.req.param('id'));
        const [update] = await db
            .select({
            id: campaignUpdates.id,
            campaignId: campaignUpdates.campaignId,
            updateTitle: campaignUpdates.updateTitle,
            content: campaignUpdates.content,
            mediaUrl: campaignUpdates.mediaUrl,
            createdAt: campaignUpdates.createdAt,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
            campaignTitle: campaigns.projectTitle,
        })
            .from(campaignUpdates)
            .leftJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .where(eq(campaignUpdates.id, updateId))
            .limit(1);
        if (!update) {
            return c.json({ error: 'Update not found' }, 404);
        }
        return c.json(update);
    }
    catch (error) {
        console.error('Get update error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Update campaign update (artist only)
updatesRouter.put('/:id', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const updateId = parseInt(c.req.param('id'));
        const body = await c.req.json();
        // Validate input
        const validatedData = campaignUpdateSchema.parse(body);
        // Check if update exists and user has permission
        const [existingUpdate] = await db
            .select({
            id: campaignUpdates.id,
            campaignId: campaignUpdates.campaignId,
        })
            .from(campaignUpdates)
            .leftJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
            .where(and(eq(campaignUpdates.id, updateId), eq(campaigns.artistId, user.walletAddress)))
            .limit(1);
        if (!existingUpdate) {
            return c.json({ error: 'Update not found or access denied' }, 404);
        }
        // Update campaign update
        const [updatedUpdate] = await db.update(campaignUpdates)
            .set({
            updateTitle: validatedData.updateTitle,
            content: validatedData.content,
            mediaUrl: validatedData.mediaUrl || null,
        })
            .where(eq(campaignUpdates.id, updateId))
            .returning();
        return c.json({
            id: updatedUpdate.id,
            campaignId: updatedUpdate.campaignId,
            updateTitle: updatedUpdate.updateTitle,
            content: updatedUpdate.content,
            mediaUrl: updatedUpdate.mediaUrl,
            createdAt: updatedUpdate.createdAt,
            artistName: user.username,
            artistAvatar: user.profileImagUrl,
        });
    }
    catch (error) {
        console.error('Update campaign update error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Delete campaign update (artist only)
updatesRouter.delete('/:id', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const updateId = parseInt(c.req.param('id'));
        // Check if update exists and user has permission
        const [existingUpdate] = await db
            .select({
            id: campaignUpdates.id,
        })
            .from(campaignUpdates)
            .leftJoin(campaigns, eq(campaignUpdates.campaignId, campaigns.id))
            .where(and(eq(campaignUpdates.id, updateId), eq(campaigns.artistId, user.walletAddress)))
            .limit(1);
        if (!existingUpdate) {
            return c.json({ error: 'Update not found or access denied' }, 404);
        }
        // Delete campaign update
        await db.delete(campaignUpdates)
            .where(eq(campaignUpdates.id, updateId));
        return c.json({ message: 'Update deleted successfully' });
    }
    catch (error) {
        console.error('Delete campaign update error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
export default updatesRouter;
