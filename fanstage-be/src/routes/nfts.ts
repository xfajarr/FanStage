import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { membershipPasses, users, investments, campaigns } from '../db/schema.js';
import { membershipPassSchema } from '../validators/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const nftsRouter = new Hono();

// Get user's NFT collection
nftsRouter.get('/user', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { page = '1', limit = '10' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get membership passes
    const membershipPassList = await db
      .select({
        id: membershipPasses.id,
        tokenId: membershipPasses.nftTokenId,
        name: sql<string>`CONCAT(${users.username}, ' - ', ${membershipPasses.passTier}, ' Pass')`,
        description: sql<string>`CONCAT('Official ', ${membershipPasses.passTier}, ' membership pass for ', ${users.username})`,
        image: sql<string>`'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'`, // Mock image
        type: sql<string>`'member-pass'`,
        artistId: membershipPasses.artistId,
        artistName: users.username,
        campaignId: sql<string>`NULL`,
        tier: membershipPasses.passTier,
        benefits: sql<string[]>`CASE 
          WHEN ${membershipPasses.passTier} = 'VIP' THEN ARRAY['Exclusive merchandise access', 'Priority ticket sales', 'Monthly Q&A sessions']
          WHEN ${membershipPasses.passTier} = 'Premium' THEN ARRAY['Exclusive merchandise access', 'Priority ticket sales']
          ELSE ARRAY['Basic fan access']
        END`,
        mintDate: membershipPasses.createdAt,
      })
      .from(membershipPasses)
      .leftJoin(users, eq(membershipPasses.artistId, users.walletAddress))
      .where(eq(membershipPasses.ownerId, user.walletAddress))
      .orderBy(desc(membershipPasses.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Get investment NFTs
    const investmentNFTs = await db
      .select({
        id: investments.id,
        tokenId: investments.nftTokenId,
        name: sql<string>`CONCAT(${users.username}, ' - ', ${campaigns.projectTitle}, ' Investment')`,
        description: sql<string>`CONCAT('Investment NFT for ', ${campaigns.projectTitle}, ' campaign')`,
        image: sql<string>`'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400'`, // Mock image
        type: sql<string>`'proof-of-support'`,
        artistId: campaigns.artistId,
        artistName: users.username,
        campaignId: campaigns.id,
        tier: sql<string>`CASE 
          WHEN ${investments.investedAmountToken} >= 1000 THEN 'Patron'
          WHEN ${investments.investedAmountToken} >= 250 THEN 'Believer'
          ELSE 'Supporter'
        END`,
        benefits: sql<string[]>`CASE 
          WHEN ${investments.investedAmountToken} >= 1000 THEN ARRAY['All Believer benefits', 'Exclusive meet & greet', 'Signed album artwork', 'VIP concert tickets']
          WHEN ${investments.investedAmountToken} >= 250 THEN ARRAY['All Supporter benefits', 'Limited edition vinyl', 'Early access to singles', 'Name in album credits']
          ELSE ARRAY['Digital album download', 'Exclusive behind-the-scenes updates', 'Supporter NFT badge']
        END`,
        mintDate: investments.createdAt,
      })
      .from(investments)
      .leftJoin(campaigns, eq(investments.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
      .where(eq(investments.investorId, user.walletAddress))
      .orderBy(desc(investments.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Combine both types of NFTs
    const allNFTs = [...membershipPassList, ...investmentNFTs]
      .sort((a, b) => new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime())
      .slice(0, parseInt(limit));

    return c.json({
      nfts: allNFTs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allNFTs.length,
      },
    });
  } catch (error) {
    console.error('Get user NFTs error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get campaign NFTs
nftsRouter.get('/campaign/:id', async (c) => {
  try {
    const campaignId = parseInt(c.req.param('id'));
    const { page = '1', limit = '10' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const campaignNFTs = await db
      .select({
        id: investments.id,
        tokenId: investments.nftTokenId,
        name: sql<string>`CONCAT(${users.username}, ' - ', ${campaigns.projectTitle}, ' Investment')`,
        description: sql<string>`CONCAT('Investment NFT for ', ${campaigns.projectTitle}, ' campaign')`,
        image: sql<string>`'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400'`, // Mock image
        type: sql<string>`'proof-of-support'`,
        artistId: campaigns.artistId,
        artistName: users.username,
        campaignId: campaigns.id,
        tier: sql<string>`CASE 
          WHEN ${investments.investedAmountToken} >= 1000 THEN 'Patron'
          WHEN ${investments.investedAmountToken} >= 250 THEN 'Believer'
          ELSE 'Supporter'
        END`,
        benefits: sql<string[]>`CASE 
          WHEN ${investments.investedAmountToken} >= 1000 THEN ARRAY['All Believer benefits', 'Exclusive meet & greet', 'Signed album artwork', 'VIP concert tickets']
          WHEN ${investments.investedAmountToken} >= 250 THEN ARRAY['All Supporter benefits', 'Limited edition vinyl', 'Early access to singles', 'Name in album credits']
          ELSE ARRAY['Digital album download', 'Exclusive behind-the-scenes updates', 'Supporter NFT badge']
        END`,
        mintDate: investments.createdAt,
        investorId: investments.investorId,
        investorName: sql<string>`(SELECT username FROM users WHERE wallet_address = ${investments.investorId})`,
      })
      .from(investments)
      .leftJoin(campaigns, eq(investments.campaignId, campaigns.id))
      .leftJoin(users, eq(campaigns.artistId, users.walletAddress))
      .where(eq(investments.campaignId, campaignId))
      .orderBy(desc(investments.investedAmountToken))
      .limit(parseInt(limit))
      .offset(offset);

    return c.json({
      nfts: campaignNFTs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: campaignNFTs.length,
      },
    });
  } catch (error) {
    console.error('Get campaign NFTs error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mint investment NFT (created automatically when investment is made)
nftsRouter.post('/mint', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { campaignId, tier, transactionHash } = await c.req.json();
    
    if (!campaignId || !tier || !transactionHash) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // This would typically be called from the investment endpoint
    // Here we just return a success response
    const nftData = {
      id: Date.now(),
      tokenId: `0x${Math.random().toString(16).substr(2, 8)}`,
      name: 'Investment NFT',
      description: 'NFT for campaign investment',
      image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400',
      type: 'proof-of-support',
      artistId: 'artist-address',
      artistName: 'Artist Name',
      campaignId,
      tier,
      benefits: ['Investment benefits'],
      mintDate: new Date().toISOString(),
    };

    return c.json({ nft: nftData });
  } catch (error) {
    console.error('Mint NFT error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mint membership pass
nftsRouter.post('/membership-pass', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate input
    const validatedData = membershipPassSchema.parse(body);
    
    // Check if user already has a membership pass for this artist
    const [existingPass] = await db.select()
      .from(membershipPasses)
      .where(and(
        eq(membershipPasses.ownerId, user.walletAddress),
        eq(membershipPasses.artistId, validatedData.artistId)
      ))
      .limit(1);
    
    if (existingPass) {
      return c.json({ error: 'User already has a membership pass for this artist' }, 400);
    }

    // Create membership pass
    const [newPass] = await db.insert(membershipPasses)
      .values({
        artistId: validatedData.artistId,
        ownerId: user.walletAddress,
        passTier: validatedData.passTier,
        nftTokenId: validatedData.nftTokenId,
        mintTransactionHash: validatedData.mintTransactionHash,
      })
      .returning();

    // Get artist info
    const [artist] = await db.select()
      .from(users)
      .where(eq(users.walletAddress, validatedData.artistId))
      .limit(1);

    return c.json({
      id: newPass.id,
      tokenId: newPass.nftTokenId,
      name: `${artist?.username} - ${validatedData.passTier} Pass`,
      description: `Official ${validatedData.passTier} membership pass for ${artist?.username}`,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      type: 'member-pass',
      artistId: newPass.artistId,
      artistName: artist?.username,
      tier: validatedData.passTier,
      benefits: validatedData.passTier === 'VIP' 
        ? ['Exclusive merchandise access', 'Priority ticket sales', 'Monthly Q&A sessions']
        : ['Basic fan access'],
      mintDate: newPass.createdAt,
    });
  } catch (error) {
    console.error('Mint membership pass error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default nftsRouter;