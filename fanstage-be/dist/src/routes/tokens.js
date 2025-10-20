import { Hono } from 'hono';
import { authMiddleware, artistMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { artistTokens, users, campaigns } from '../db/schema.js';
import { artistTokenSchema } from '../validators/index.js';
import { eq, desc, sql } from 'drizzle-orm';
const tokensRouter = new Hono();
// Get artist token info
tokensRouter.get('/artist/:artistId', async (c) => {
    try {
        const artistId = c.req.param('artistId');
        const [artistToken] = await db
            .select({
            id: artistTokens.id,
            artistId: artistTokens.artistId,
            artistName: users.username,
            artistAvatar: users.profileImagUrl,
            tokenName: artistTokens.tokenName,
            tokenSymbol: artistTokens.tokenSymbol,
            tokenAddress: artistTokens.tokenAddress,
            createdAt: artistTokens.createdAt,
        })
            .from(artistTokens)
            .leftJoin(users, eq(artistTokens.artistId, users.walletAddress))
            .where(eq(artistTokens.artistId, artistId))
            .limit(1);
        if (!artistToken) {
            return c.json({ error: 'Artist token not found' }, 404);
        }
        // Get market data (mock data for now)
        const marketData = {
            totalSupply: 1000000,
            currentPrice: 0.85,
            marketCap: 850000,
            holders: 2847,
            change24h: 5.2,
        };
        return c.json({
            ...artistToken,
            ...marketData,
        });
    }
    catch (error) {
        console.error('Get artist token error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get market data for all tokens
tokensRouter.get('/market', async (c) => {
    try {
        const marketTokens = await db
            .select({
            id: artistTokens.id,
            artistId: artistTokens.artistId,
            artistName: users.username,
            symbol: artistTokens.tokenSymbol,
            tokenAddress: artistTokens.tokenAddress,
        })
            .from(artistTokens)
            .leftJoin(users, eq(artistTokens.artistId, users.walletAddress))
            .orderBy(desc(artistTokens.createdAt));
        // Add mock market data
        const tokensWithMarketData = marketTokens.map((token, index) => ({
            id: token.id,
            artistId: token.artistId,
            artistName: token.artistName,
            symbol: token.symbol,
            totalSupply: 1000000 + index * 500000,
            currentPrice: 0.85 + index * 0.2,
            marketCap: (1000000 + index * 500000) * (0.85 + index * 0.2),
            holders: 2847 + index * 1000,
            change24h: 5.2 - index * 1.5,
        }));
        return c.json({ tokens: tokensWithMarketData });
    }
    catch (error) {
        console.error('Get market data error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Create artist token (artist only)
tokensRouter.post('/', authMiddleware, artistMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        // Validate input
        const validatedData = artistTokenSchema.parse(body);
        // Check if user already has a token
        const [existingToken] = await db.select()
            .from(artistTokens)
            .where(eq(artistTokens.artistId, user.walletAddress))
            .limit(1);
        if (existingToken) {
            return c.json({ error: 'Artist already has a token' }, 400);
        }
        // Create artist token
        const [newToken] = await db.insert(artistTokens)
            .values({
            artistId: user.walletAddress,
            tokenName: validatedData.tokenName,
            tokenSymbol: validatedData.tokenSymbol,
            tokenAddress: validatedData.tokenAddress,
        })
            .returning();
        return c.json({
            id: newToken.id,
            artistId: newToken.artistId,
            artistName: user.username,
            artistAvatar: user.profileImagUrl,
            tokenName: newToken.tokenName,
            tokenSymbol: newToken.tokenSymbol,
            tokenAddress: newToken.tokenAddress,
            createdAt: newToken.createdAt,
            totalSupply: 1000000,
            currentPrice: 0.85,
            marketCap: 850000,
            holders: 0,
            change24h: 0,
        });
    }
    catch (error) {
        console.error('Create artist token error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Get user's staking positions
tokensRouter.get('/staking/positions', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        // Mock staking positions data
        const stakingPositions = [
            {
                id: '1',
                artistId: '0x853f43eA9E48DAe9f41d3Cc21f8F72A567DE5d3B',
                artistName: 'Luna Rivers',
                tokenSymbol: 'LUNA',
                stakedAmount: 5000,
                apy: 12.5,
                startDate: '2025-01-15',
                earnedYield: 52.08,
                status: 'active',
            },
            {
                id: '2',
                artistId: '0x9A2B1e3F4c5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F',
                artistName: 'Marcus Blake',
                tokenSymbol: 'BLAKE',
                stakedAmount: 2500,
                apy: 15.0,
                startDate: '2025-02-01',
                earnedYield: 15.62,
                status: 'active',
            },
        ];
        return c.json({ positions: stakingPositions });
    }
    catch (error) {
        console.error('Get staking positions error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Stake tokens
tokensRouter.post('/stake', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const { artistId, tokenSymbol, stakedAmount } = await c.req.json();
        if (!artistId || !tokenSymbol || !stakedAmount) {
            return c.json({ error: 'Missing required fields' }, 400);
        }
        // Mock staking response
        const stakingPosition = {
            id: Date.now().toString(),
            artistId,
            artistName: 'Artist Name', // Would fetch from DB
            tokenSymbol,
            stakedAmount,
            apy: 12.5,
            startDate: new Date().toISOString().split('T')[0],
            earnedYield: 0,
            status: 'active',
        };
        return c.json({ position: stakingPosition });
    }
    catch (error) {
        console.error('Stake tokens error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
// Claim staking rewards
tokensRouter.post('/staking/claim', authMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const { positionId } = await c.req.json();
        if (!positionId) {
            return c.json({ error: 'Position ID is required' }, 400);
        }
        // Mock claim response
        const claimResult = {
            positionId,
            claimedAmount: 52.08,
            claimedAt: new Date().toISOString(),
        };
        return c.json({ claim: claimResult });
    }
    catch (error) {
        console.error('Claim staking rewards error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});
export default tokensRouter;
