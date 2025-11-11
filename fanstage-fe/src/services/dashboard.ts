import { apiClient } from './privyAuth';
import {
  graphqlQuery,
  CAMPAIGN_QUERIES,
  ARTIST_QUERIES,
  FAN_QUERIES,
  TOKEN_QUERIES,
  GetAllCampaignsResponse,
  GetAllArtistsResponse,
  GetFanActivityResponse,
  GetFanTokenHoldingsResponse,
  IndexedFundingReceived,
  IndexedTierBadge,
  IndexedRevenueClaim,
  IndexedTokenTransfer,
} from './graphql';
import campaignsApi from './campaigns';
import { ipfsService } from './ipfs';

export interface DashboardStats {
  totalInvested: number;
  totalEarned: number;
  totalTokensHeld: number;
  totalTokenValue: number;
}

export interface Investment {
  id: string;
  campaignId: string;
  campaignTitle: string;
  artistName: string;
  amount: number;
  date: string;
  profitShare: number;
  status: 'active' | 'completed' | 'ended';
  earnedProfit?: number;
  transactionHash?: string;
}

export interface ArtistTokenHolding {
  id: string;
  artistToken: string;
  campaignId: string;
  campaignTitle: string;
  artistName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAmount: number;
  investmentDate: string;
  campaignContract: string;
  status: 'active' | 'completed';
}

export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  type: 'proof-of-support' | 'member-pass' | 'reward';
  artistId: string;
  artistName: string;
  campaignId?: string;
  tier?: string;
  benefits?: string[];
  mintDate: string;
}

export interface ArtistDashboardData {
  stats: {
    totalCampaigns: number;
    totalFundsRaised: number;
    completedCampaigns: number;
    totalInvestors: number;
  };
  campaigns: Array<{
    id: number;
    title: string;
    status: string;
    fundingGoal: string;
    currentFunding: string;
    backerCount: number;
    endDate: string;
  }>;
  revenue: {
    totalRevenue: number;
    pendingRevenue: number;
    distributedRevenue: number;
  };
}

export interface FanDashboardData {
  stats: DashboardStats;
  investments: Investment[];
  artistTokens: ArtistTokenHolding[];
  nfts: NFTItem[];
}

/**
 * Dashboard API service for role-based dashboard data
 */
export const dashboardApi = {
  /**
   * Get dashboard data for artist users
   */
  getArtistDashboard: async (artistWallet: string): Promise<ArtistDashboardData> => {
    try {
      // Fetch campaigns by this artist
      const campaignsData = await campaignsApi.getCampaigns({ artist: artistWallet });
      const artistCampaigns = campaignsData.campaigns;

      // Calculate artist statistics
      const totalCampaigns = artistCampaigns.length;
      const completedCampaigns = artistCampaigns.filter(c => 
        c.status === 'Completed' || c.status === 'Funded'
      ).length;
      
      const totalFundsRaised = artistCampaigns.reduce((sum, campaign) => 
        sum + Number(campaign.currentFunding), 0
      );

      // For now, estimate investor count (would need separate tracking)
      const totalInvestors = artistCampaigns.reduce((sum, campaign) => 
        sum + campaign.backerCount, 0
      );

      // Revenue calculation (would need backend integration)
      const completedFunding = artistCampaigns
        .filter(c => c.status === 'Completed')
        .reduce((sum, campaign) => sum + Number(campaign.currentFunding), 0);
      
      const totalRevenue = completedFunding * 0.8; // Assuming 80% artist share average
      const distributedRevenue = totalRevenue; // All completed campaigns are distributed
      const pendingRevenue = 0; // No pending revenue for now

      return {
        stats: {
          totalCampaigns,
          totalFundsRaised,
          completedCampaigns,
          totalInvestors,
        },
        campaigns: artistCampaigns.map(campaign => ({
          id: campaign.id,
          title: campaign.title,
          status: campaign.status,
          fundingGoal: campaign.fundingGoal,
          currentFunding: campaign.currentFunding,
          backerCount: campaign.backerCount,
          endDate: campaign.endDate,
        })),
        revenue: {
          totalRevenue,
          pendingRevenue,
          distributedRevenue,
        },
      };
    } catch (error) {
      console.error('Error fetching artist dashboard:', error);
      throw error;
    }
  },

  /**
   * Get dashboard data for fan users
   */
  getFanDashboard: async (userWallet: string): Promise<FanDashboardData> => {
    try {
      // Fetch comprehensive fan activity and token holdings from the indexer
      const [fanActivity, tokenHoldings] = await Promise.all([
        graphqlQuery<GetFanActivityResponse>(
          FAN_QUERIES.GET_FAN_ACTIVITY,
          { funder: userWallet.toLowerCase() }
        ),
        graphqlQuery<GetFanTokenHoldingsResponse>(
          TOKEN_QUERIES.GET_FAN_TOKEN_HOLDINGS,
          { fanAddress: userWallet.toLowerCase() }
        ),
      ]);

      // Fetch all campaigns and artists for context
      const [campaignsData, artistsData] = await Promise.all([
        graphqlQuery<GetAllCampaignsResponse>(CAMPAIGN_QUERIES.GET_ALL_CAMPAIGNS),
        graphqlQuery<GetAllArtistsResponse>(ARTIST_QUERIES.GET_ALL_ARTISTS),
      ]);

      // Create lookup maps
      const campaignMap = new Map(
        campaignsData.CampaignRegistry_CampaignCreated.map(c => [c.campaignContract.toLowerCase(), c])
      );
      const artistMap = new Map(
        artistsData.ArtistIdentity_ArtistRegistered.map(a => [a.artist.toLowerCase(), a])
      );

      // Convert blockchain data to dashboard format
      const investments: Investment[] = fanActivity.investments.map((investment, index) => {
        const campaign = campaignMap.get(investment.campaignContract.toLowerCase());
        const artist = campaign ? artistMap.get(campaign.artist.toLowerCase()) : null;
        
        // Find matching revenue claim for this investment
        const revenueClaim = fanActivity.revenueClaims.find(
          claim => claim.campaignContract.toLowerCase() === investment.campaignContract.toLowerCase()
        );

        return {
          id: `inv_${index}`,
          campaignId: campaign?.campaignId || investment.campaignContract,
          campaignTitle: campaign?.title || `Campaign ${campaign?.campaignId || 'Unknown'}`,
          artistName: artist?.name || 'Unknown Artist',
          amount: Number(investment.amount) / 1e2, // Convert from wei to IDRX (2 decimals)
          date: new Date(Number(investment.blockTimestamp) * 1000).toISOString(),
          profitShare: campaign ? Number(campaign.funderSharePercent || 0) : 0,
          status: campaign?.status === 'Completed' ? 'completed' : 'active',
          earnedProfit: revenueClaim ? Number(revenueClaim.amount) / 1e2 : 0,
          transactionHash: investment.transactionHash,
        };
      });

      // Convert tier badges to NFTs with tier images from campaign metadata
      const nfts: NFTItem[] = await Promise.all(
        fanActivity.badges.map(async (badge, index) => {
          const campaign = campaignMap.get(badge.campaignContract.toLowerCase());
          const artist = campaign ? artistMap.get(campaign.artist.toLowerCase()) : null;
          
          // Try to get tier image from campaign IPFS metadata
          let tierImageUrl = '/placeholder-badge.png';
          
          if (campaign?.ipfsHash) {
            try {
              console.log(`[DEBUG] Fetching campaign metadata for tier "${badge.tierName}" from IPFS:`, campaign.ipfsHash);
              
              // First try the IPFS service
              let campaignMetadata: any;
              try {
                campaignMetadata = await ipfsService.getFile(campaign.ipfsHash) as any;
              } catch (error) {
                console.log('[DEBUG] IPFS service failed, trying direct gateway fetch');
                // Fallback to direct gateway fetch
                const cid = campaign.ipfsHash.replace('ipfs://', '');
                const gatewayUrl = `https://sapphire-wrong-raven-155.mypinata.cloud/files/${cid}`;
                const response = await fetch(gatewayUrl);
                campaignMetadata = await response.json();
              }
              
              console.log('[DEBUG] Raw campaign metadata:', campaignMetadata);
              
              // If campaignMetadata is IPFS metadata (has cid, url), fetch the actual content
              if (campaignMetadata?.url && campaignMetadata?.cid && !campaignMetadata?.tiers) {
                console.log('[DEBUG] Got IPFS metadata, fetching actual content from:', campaignMetadata.url);
                const response = await fetch(campaignMetadata.url);
                campaignMetadata = await response.json();
                console.log('[DEBUG] Actual campaign content:', campaignMetadata);
              }
              
              if (campaignMetadata?.tiers && Array.isArray(campaignMetadata.tiers)) {
                console.log('[DEBUG] Available tiers in metadata:', campaignMetadata.tiers.map((t: any) => ({ 
                  name: t.name, 
                  imageUrl: t.imageUrl 
                })));
                
                // Try exact match first
                let tierData = campaignMetadata.tiers.find((t: any) => t.name === badge.tierName);
                
                // If exact match fails, try case-insensitive match
                if (!tierData) {
                  tierData = campaignMetadata.tiers.find((t: any) => 
                    t.name?.toLowerCase().trim() === badge.tierName?.toLowerCase().trim()
                  );
                  console.log('[DEBUG] Case-insensitive match result:', tierData);
                }
                
                console.log(`[DEBUG] Final tier data for "${badge.tierName}":`, tierData);
                
                if (tierData?.imageUrl && tierData.imageUrl.trim()) {
                  tierImageUrl = tierData.imageUrl;
                  console.log(`[DEBUG] ✓ Using tier image URL: ${tierImageUrl}`);
                } else {
                  console.log(`[DEBUG] ✗ No valid imageUrl found for tier "${badge.tierName}"`);
                }
              } else {
                console.log('[DEBUG] ✗ No tiers array found in campaign metadata');
              }
            } catch (error) {
              console.error(`[DEBUG] Failed to fetch tier image for ${badge.tierName}:`, error);
            }
          } else {
            console.log(`[DEBUG] ✗ No IPFS hash found for campaign`, campaign);
          }

          return {
            id: `badge_${index}`,
            tokenId: badge.tierId,
            name: `${badge.tierName} Badge`,
            description: `${badge.tierName} tier badge from ${campaign?.title || 'campaign'}`,
            image: tierImageUrl,
            type: 'proof-of-support',
            artistId: campaign?.artist || '',
            artistName: artist?.name || 'Unknown Artist',
            campaignId: campaign?.campaignId,
            tier: badge.tierName,
            benefits: [`${badge.tierName} tier benefits`, 'Proof of support', 'Exclusive access'],
            mintDate: new Date(Number(badge.blockTimestamp) * 1000).toISOString(),
          };
        })
      );

      // Convert artist token holdings to dashboard format
      const artistTokens: ArtistTokenHolding[] = tokenHoldings.ArtistToken_Transfer.map((tokenTransfer, index) => {
        const campaign = campaignMap.get(tokenTransfer.campaignContract?.toLowerCase() || '');
        const artist = campaign ? artistMap.get(campaign.artist.toLowerCase()) : null;
        
        return {
          id: `token_${index}`,
          artistToken: tokenTransfer.artistToken,
          campaignId: campaign?.campaignId || 'Unknown',
          campaignTitle: campaign?.title || `Campaign ${campaign?.campaignId || 'Unknown'}`,
          artistName: artist?.name || 'Unknown Artist',
          tokenName: tokenTransfer.tokenName || 'Artist Token',
          tokenSymbol: tokenTransfer.tokenSymbol || 'FANT',
          tokenAmount: Number(tokenTransfer.value) / 1e2, // Convert from 2 decimals
          investmentDate: new Date(Number(tokenTransfer.blockTimestamp) * 1000).toISOString(),
          campaignContract: tokenTransfer.campaignContract || '',
          status: campaign?.status === 'Completed' ? 'completed' : 'active',
        };
      });

      // Calculate dashboard statistics
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalEarned = investments.reduce((sum, inv) => sum + (inv.earnedProfit || 0), 0);
      const totalTokensHeld = artistTokens.reduce((sum, token) => sum + token.tokenAmount, 0);
      const totalTokenValue = totalTokensHeld; // 1:1 ratio with IDRX investment

      const stats: DashboardStats = {
        totalInvested,
        totalEarned,
        totalTokensHeld,
        totalTokenValue,
      };

      return {
        stats,
        investments,
        artistTokens,
        nfts,
      };
    } catch (error) {
      console.error('Error fetching fan dashboard:', error);
      // Return empty data on error instead of throwing
      return {
        stats: { totalInvested: 0, totalEarned: 0, totalTokensHeld: 0, totalTokenValue: 0 },
        investments: [],
        artistTokens: [],
        nfts: [],
      };
    }
  },

  /**
   * Get investment history for a user (would need backend integration)
   */
  getUserInvestments: async (userWallet: string): Promise<Investment[]> => {
    try {
      // This would need backend API to track user investments
      // For now, return empty array
      const response = await apiClient.get(`/investments/user/${userWallet}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user investments:', error);
      return [];
    }
  },

  /**
   * Get artist token holdings for a user
   */
  getUserArtistTokens: async (userWallet: string): Promise<ArtistTokenHolding[]> => {
    try {
      // Fetch token holdings from indexer
      const tokenHoldings = await graphqlQuery<GetFanTokenHoldingsResponse>(
        TOKEN_QUERIES.GET_FAN_TOKEN_HOLDINGS,
        { fanAddress: userWallet.toLowerCase() }
      );

      // Fetch campaigns and artists for context
      const [campaignsData, artistsData] = await Promise.all([
        graphqlQuery<GetAllCampaignsResponse>(CAMPAIGN_QUERIES.GET_ALL_CAMPAIGNS),
        graphqlQuery<GetAllArtistsResponse>(ARTIST_QUERIES.GET_ALL_ARTISTS),
      ]);

      // Create lookup maps
      const campaignMap = new Map(
        campaignsData.CampaignRegistry_CampaignCreated.map(c => [c.campaignContract.toLowerCase(), c])
      );
      const artistMap = new Map(
        artistsData.ArtistIdentity_ArtistRegistered.map(a => [a.artist.toLowerCase(), a])
      );

      // Convert to dashboard format
      return tokenHoldings.ArtistToken_Transfer.map((tokenTransfer, index) => {
        const campaign = campaignMap.get(tokenTransfer.campaignContract?.toLowerCase() || '');
        const artist = campaign ? artistMap.get(campaign.artist.toLowerCase()) : null;
        
        return {
          id: `token_${index}`,
          artistToken: tokenTransfer.artistToken,
          campaignId: campaign?.campaignId || 'Unknown',
          campaignTitle: campaign?.title || `Campaign ${campaign?.campaignId || 'Unknown'}`,
          artistName: artist?.name || 'Unknown Artist',
          tokenName: tokenTransfer.tokenName || 'Artist Token',
          tokenSymbol: tokenTransfer.tokenSymbol || 'FANT',
          tokenAmount: Number(tokenTransfer.value) / 1e2, // Convert from 2 decimals
          investmentDate: new Date(Number(tokenTransfer.blockTimestamp) * 1000).toISOString(),
          campaignContract: tokenTransfer.campaignContract || '',
          status: campaign?.status === 'Completed' ? 'completed' : 'active',
        };
      });
    } catch (error) {
      console.error('Error fetching artist token holdings:', error);
      return [];
    }
  },

  /**
   * Get NFT collection for a user (would need backend integration)
   */
  getUserNFTs: async (userWallet: string): Promise<NFTItem[]> => {
    try {
      // This would need backend API to track NFT ownership
      const response = await apiClient.get(`/nfts/user/${userWallet}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  },
};

export default dashboardApi;