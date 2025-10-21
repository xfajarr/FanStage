import { Hono } from 'hono';
import { authMiddleware, artistMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { campaigns, users, artistTokens, investments } from '../db/schema.js';
import { campaignSchema } from '../validators/index.js';
import { eq, and, desc, lt, gte, sql } from 'drizzle-orm';
const campaignsRouter = new Hono();
// Get all campaigns with filtering
campaignsRouter.get('/', async (c) => {
    try {
        const { category, status, search, page = '1', limit = '10' } = c.req.query();
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let query = db
            .select({
            id: campaigns.id,
            artistId: campaigns.artistId,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
            title: campaigns.projectTitle,
            description: campaigns.shortDescription,
            category: sql `'album'`, // Default category, should be added to schema
            fundingGoal: campaigns.targetFundingToken,
            currentFunding: campaigns.currentFundingToken,
            backerCount: sql `count(${investments.id})`,
            startDate: campaigns.createdAt,
            endDate: campaigns.deadline,
            profitShare: sql `json_build_object('fan', ${campaigns.profitSharePercentage}, 'artist', 100 - ${campaigns.profitSharePercentage})`,
            ipfsHash: campaigns.ipfsHash,
            coverImage: campaigns.coverImageUrl,
            status: campaigns.campaignStatus,
        })
            .from(campaigns)
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .leftJoin(investments, eq(campaigns.id, investments.campaignId))
            .groupBy(campaigns.id, users.username, users.profileImagUrl)
            .orderBy(desc(campaigns.createdAt))
            .limit(parseInt(limit))
            .offset(offset);
        // Apply filters
        const conditions = [];
        if (status) {
            conditions.push(eq(campaigns.campaignStatus, status));
        }
        if (search) {
            conditions.push(sql `${campaigns.projectTitle} ILIKE ${'%' + search + '%'}`);
        }
        let campaignList;
        if (conditions.length > 0) {
            campaignList = await query.where(and(...conditions));
        }
        else {
            campaignList = await query;
        }
        return c.json({
            campaigns: campaignList,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: campaignList.length,
            },
        });
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get featured campaigns
campaignsRouter.get('/featured', async (c) => {
    try {
        const featuredCampaigns = await db
            .select({
            id: campaigns.id,
            artistId: campaigns.artistId,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
            title: campaigns.projectTitle,
            description: campaigns.shortDescription,
            category: sql `'album'`,
            fundingGoal: campaigns.targetFundingToken,
            currentFunding: campaigns.currentFundingToken,
            backerCount: sql `count(${investments.id})`,
            startDate: campaigns.createdAt,
            endDate: campaigns.deadline,
            profitShare: sql `json_build_object('fan', ${campaigns.profitSharePercentage}, 'artist', 100 - ${campaigns.profitSharePercentage})`,
            ipfsHash: campaigns.ipfsHash,
            coverImage: campaigns.coverImageUrl,
            status: campaigns.campaignStatus,
        })
            .from(campaigns)
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .leftJoin(investments, eq(campaigns.id, investments.campaignId))
            .where(and(eq(campaigns.campaignStatus, 'ongoing'), gte(campaigns.deadline, new Date())))
            .groupBy(campaigns.id, users.username, users.profileImagUrl)
            .orderBy(desc(campaigns.currentFundingToken))
            .limit(6);
        return c.json({ campaigns: featuredCampaigns });
    }
    catch (error) {
        console.error('Get featured campaigns error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get campaign by ID
campaignsRouter.get('/:id', async (c) => {
    try {
        const campaignId = parseInt(c.req.param('id'));
        const [campaign] = await db
            .select({
            id: campaigns.id,
            artistId: campaigns.artistId,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
            title: campaigns.projectTitle,
            description: campaigns.shortDescription,
            category: sql `'album'`,
            fundingGoal: campaigns.targetFundingToken,
            currentFunding: campaigns.currentFundingToken,
            backerCount: sql `count(${investments.id})`,
            startDate: campaigns.createdAt,
            endDate: campaigns.deadline,
            profitShare: sql `json_build_object('fan', ${campaigns.profitSharePercentage}, 'artist', 100 - ${campaigns.profitSharePercentage})`,
            ipfsHash: campaigns.ipfsHash,
            coverImage: campaigns.coverImageUrl,
            status: campaigns.campaignStatus,
        })
            .from(campaigns)
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .leftJoin(investments, eq(campaigns.id, investments.campaignId))
            .where(eq(campaigns.id, campaignId))
            .groupBy(campaigns.id, users.username, users.profileImagUrl)
            .limit(1);
        if (!campaign) {
            return c.json({ error: 'Campaign not found' }, 404);
        }
        return c.json(campaign);
    }
    catch (error) {
        console.error('Get campaign error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Create new campaign (artist only)
campaignsRouter.post('/', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        // Validate input
        const validatedData = campaignSchema.parse(body);
        // Check if artist has a token
        const [artistToken] = await db.select()
            .from(artistTokens)
            .where(eq(artistTokens.artistId, user.walletAddress))
            .limit(1);
        if (!artistToken) {
            return c.json({ error: 'Artist must have a token to create campaigns' }, 400);
        }
        // Create campaign
        const [newCampaign] = await db.insert(campaigns)
            .values({
            artistId: user.walletAddress,
            tokenAddress: artistToken.tokenAddress,
            projectTitle: validatedData.projectTitle,
            shortDescription: validatedData.shortDescription,
            ipfsHash: validatedData.ipfsHash,
            targetFundingToken: validatedData.targetFundingToken.toString(),
            profitSharePercentage: validatedData.profitSharePercentage,
            deadline: validatedData.deadline,
            coverImageUrl: validatedData.coverImageUrl || null,
        })
            .returning();
        return c.json({
            id: newCampaign.id,
            artistId: newCampaign.artistId,
            artistName: user.username,
            artistAvatar: user.profileImagUrl,
            title: newCampaign.projectTitle,
            description: newCampaign.shortDescription,
            category: 'album',
            fundingGoal: newCampaign.targetFundingToken,
            currentFunding: newCampaign.currentFundingToken,
            backerCount: 0,
            startDate: newCampaign.createdAt,
            endDate: newCampaign.deadline,
            profitShare: {
                fan: newCampaign.profitSharePercentage,
                artist: 100 - newCampaign.profitSharePercentage,
            },
            ipfsHash: newCampaign.ipfsHash,
            coverImage: newCampaign.coverImageUrl,
            status: newCampaign.campaignStatus,
        });
    }
    catch (error) {
        console.error('Create campaign error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Update campaign (artist only)
campaignsRouter.put('/:id', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const campaignId = parseInt(c.req.param('id'));
        const body = await c.req.json();
        // Validate input
        const validatedData = campaignSchema.parse(body);
        // Check if campaign exists and belongs to user
        const [existingCampaign] = await db.select()
            .from(campaigns)
            .where(and(eq(campaigns.id, campaignId), eq(campaigns.artistId, user.walletAddress)))
            .limit(1);
        if (!existingCampaign) {
            return c.json({ error: 'Campaign not found or access denied' }, 404);
        }
        // Update campaign
        const { projectTitle, shortDescription, ipfsHash, targetFundingToken, profitSharePercentage, deadline, coverImageUrl, } = validatedData;
        const [updatedCampaign] = await db.update(campaigns)
            .set({
            projectTitle,
            shortDescription,
            ipfsHash,
            targetFundingToken: targetFundingToken.toString(),
            profitSharePercentage,
            deadline,
            coverImageUrl: coverImageUrl ?? null,
            updatedAt: new Date(),
        })
            .where(eq(campaigns.id, campaignId))
            .returning();
        return c.json({
            id: updatedCampaign.id,
            artistId: updatedCampaign.artistId,
            artistName: user.username,
            artistAvatar: user.profileImagUrl,
            title: updatedCampaign.projectTitle,
            description: updatedCampaign.shortDescription,
            category: 'album',
            fundingGoal: updatedCampaign.targetFundingToken,
            currentFunding: updatedCampaign.currentFundingToken,
            backerCount: 0, // Would need to calculate from investments
            startDate: updatedCampaign.createdAt,
            endDate: updatedCampaign.deadline,
            profitShare: {
                fan: updatedCampaign.profitSharePercentage,
                artist: 100 - updatedCampaign.profitSharePercentage,
            },
            ipfsHash: updatedCampaign.ipfsHash,
            coverImage: updatedCampaign.coverImageUrl,
            status: updatedCampaign.campaignStatus,
        });
    }
    catch (error) {
        console.error('Update campaign error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
export default campaignsRouter;
