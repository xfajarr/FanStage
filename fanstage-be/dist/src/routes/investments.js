import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { investments, campaigns, users } from '../db/schema.js';
import { investmentSchema } from '../validators/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
const investmentsRouter = new Hono();
// Get user's investment history
investmentsRouter.get('/user', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const { page = '1', limit = '10' } = c.req.query();
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const userInvestments = await db
            .select({
            id: investments.id,
            campaignId: investments.campaignId,
            campaignTitle: campaigns.projectTitle,
            artistName: users.username,
            amount: investments.investedAmountToken,
            date: investments.createdAt,
            profitShare: campaigns.profitSharePercentage,
            status: sql `CASE 
          WHEN ${campaigns.campaignStatus} = 'completed' THEN 'completed'
          ELSE 'active'
        END`,
            earnedProfit: investments.actualPayoutToken,
        })
            .from(investments)
            .leftJoin(campaigns, eq(investments.campaignId, campaigns.id))
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .where(eq(investments.investorId, user.walletAddress))
            .orderBy(desc(investments.createdAt))
            .limit(parseInt(limit))
            .offset(offset);
        return c.json({
            investments: userInvestments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: userInvestments.length,
            },
        });
    }
    catch (error) {
        console.error('Get user investments error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get campaign investments
investmentsRouter.get('/campaign/:id', async (c) => {
    try {
        const campaignId = parseInt(c.req.param('id'));
        const { page = '1', limit = '10' } = c.req.query();
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const campaignInvestments = await db
            .select({
            id: investments.id,
            investorId: investments.investorId,
            investorName: users.username,
            investorAvatar: users.profileImagUrl,
            amount: investments.investedAmountToken,
            date: investments.createdAt,
            transactionHash: investments.transactionHash,
            nftTokenId: investments.nftTokenId,
        })
            .from(investments)
            .leftJoin(users, eq(investments.investorId, users.walletAddress))
            .where(eq(investments.campaignId, campaignId))
            .orderBy(desc(investments.investedAmountToken))
            .limit(parseInt(limit))
            .offset(offset);
        return c.json({
            investments: campaignInvestments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: campaignInvestments.length,
            },
        });
    }
    catch (error) {
        console.error('Get campaign investments error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Create investment (invest in campaign)
investmentsRouter.post('/', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        // Validate input
        const validatedData = investmentSchema.parse(body);
        // Check if campaign exists and is active
        const [campaign] = await db.select()
            .from(campaigns)
            .where(eq(campaigns.id, validatedData.campaignId))
            .limit(1);
        if (!campaign) {
            return c.json({ error: 'Campaign not found' }, 404);
        }
        if (campaign.campaignStatus !== 'ongoing') {
            return c.json({ error: 'Campaign is not active' }, 400);
        }
        if (new Date() > new Date(campaign.deadline)) {
            return c.json({ error: 'Campaign deadline has passed' }, 400);
        }
        // Check if transaction hash already exists
        const [existingInvestment] = await db.select()
            .from(investments)
            .where(eq(investments.transactionHash, validatedData.transactionHash))
            .limit(1);
        if (existingInvestment) {
            return c.json({ error: 'Transaction already processed' }, 400);
        }
        // Create investment
        const [newInvestment] = await db.insert(investments)
            .values({
            campaignId: validatedData.campaignId,
            investorId: user.walletAddress,
            transactionHash: validatedData.transactionHash,
            investedAmountToken: validatedData.investedAmountToken.toString(),
            nftTokenId: validatedData.nftTokenId,
            estimatedProfit: sql `(${validatedData.investedAmountToken} * ${campaign.profitSharePercentage}) / 100`,
        })
            .returning();
        // Update campaign funding
        await db.update(campaigns)
            .set({
            currentFundingToken: sql `current_funding_token + ${validatedData.investedAmountToken}`,
        })
            .where(eq(campaigns.id, validatedData.campaignId));
        return c.json({
            id: newInvestment.id,
            campaignId: newInvestment.campaignId,
            campaignTitle: campaign.projectTitle,
            artistName: '', // Would need to fetch user info
            amount: newInvestment.investedAmountToken,
            date: newInvestment.createdAt,
            profitShare: campaign.profitSharePercentage,
            status: 'active',
            earnedProfit: 0,
        });
    }
    catch (error) {
        console.error('Create investment error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get investment by ID
investmentsRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const investmentId = parseInt(c.req.param('id'));
        const [investment] = await db
            .select({
            id: investments.id,
            campaignId: investments.campaignId,
            campaignTitle: campaigns.projectTitle,
            artistName: users.username,
            artistId: campaigns.artistId,
            amount: investments.investedAmountToken,
            date: investments.createdAt,
            profitShare: campaigns.profitSharePercentage,
            status: sql `CASE 
          WHEN ${campaigns.campaignStatus} = 'completed' THEN 'completed'
          ELSE 'active'
        END`,
            earnedProfit: investments.actualPayoutToken,
            transactionHash: investments.transactionHash,
            nftTokenId: investments.nftTokenId,
            payoutStatus: investments.payoutStatus,
        })
            .from(investments)
            .leftJoin(campaigns, eq(investments.campaignId, campaigns.id))
            .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
            .where(and(eq(investments.id, investmentId), eq(investments.investorId, user.walletAddress)))
            .limit(1);
        if (!investment) {
            return c.json({ error: 'Investment not found' }, 404);
        }
        return c.json(investment);
    }
    catch (error) {
        console.error('Get investment error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
export default investmentsRouter;
