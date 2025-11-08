import { apiClient } from './privyAuth';
import {
  graphqlQuery,
  CAMPAIGN_QUERIES,
  ARTIST_QUERIES,
  GetAllCampaignsResponse,
  GetCampaignByIdResponse,
  GetAllArtistsResponse,
  IndexedCampaign,
  IndexedArtist,
} from './graphql';

export interface CreateCampaignPayload {
  projectTitle: string;
  shortDescription: string;
  ipfsHash: string;
  targetFundingToken: string;
  profitSharePercentage: number;
  deadline: string;
  coverImageUrl?: string | null;
}

export interface CampaignListItem {
  id: number;
  artistId: string;
  artistName: string | null;
  artistAvatar: string | null;
  title: string;
  description: string;
  category: string;
  fundingGoal: string;
  currentFunding: string;
  backerCount: number;
  startDate: string;
  endDate: string;
  profitShare: {
    fan: number;
    artist: number;
  };
  ipfsHash: string;
  coverImage: string | null;
  status: string;
  campaignContract: string;
}

export interface CampaignListResponse {
  campaigns: CampaignListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Convert indexed campaign data to frontend CampaignListItem format
 */
function mapIndexedCampaignToListItem(
  indexedCampaign: IndexedCampaign,
  index: number,
  artistName?: string
): CampaignListItem {
  // Convert Wei to IDRX (divide by 10^2 for 2 decimals)
  const targetAmountIDRX = indexedCampaign.targetAmount
    ? (BigInt(indexedCampaign.targetAmount) / BigInt(10 ** 2)).toString()
    : '0';

  const currentFundingIDRX = indexedCampaign.totalRaised
    ? (BigInt(indexedCampaign.totalRaised) / BigInt(10 ** 2)).toString()
    : '0';

  // Convert Unix timestamp to ISO date string
  const deadlineDate = indexedCampaign.deadline
    ? new Date(Number(indexedCampaign.deadline) * 1000).toISOString()
    : new Date().toISOString();

  const createdDate = new Date(
    Number(indexedCampaign.blockTimestamp) * 1000
  ).toISOString();

  // Calculate fan/artist profit share
  const fanShare = Number(indexedCampaign.funderSharePercent || 0);
  const artistShare = 100 - fanShare;

  // Calculate status based on funding progress, expiration, and distribution
  const now = new Date();
  const endDate = new Date(deadlineDate);
  const isExpired = now > endDate;
  
  // Check if campaign is fully funded
  const targetAmount = BigInt(indexedCampaign.targetAmount || 0);
  const raisedAmount = BigInt(indexedCampaign.totalRaised || 0);
  const isFullyFunded = targetAmount > 0 && raisedAmount >= targetAmount;
  
  let campaignStatus = 'Active';
  
  // Determine final status with priority: RevenueSubmitted → Expired → Funded → Active
  if (indexedCampaign.status === 'Completed') {
    campaignStatus = 'Completed';
  } else if (isExpired) {
    campaignStatus = 'Ended';
  } else if (isFullyFunded) {
    campaignStatus = 'Funded';
  }

  return {
    id: Number(indexedCampaign.campaignId) || index,
    artistId: indexedCampaign.artist,
    artistName: artistName || null,
    artistAvatar: null,
    title: indexedCampaign.title || `Campaign #${indexedCampaign.campaignId}`,
    description: indexedCampaign.summary || '',
    category: 'music', // Could be extended with category from IPFS metadata
    fundingGoal: targetAmountIDRX,
    currentFunding: currentFundingIDRX,
    backerCount: 0, // This would need to be tracked in additional events
    startDate: createdDate,
    endDate: deadlineDate,
    profitShare: {
      fan: fanShare,
      artist: artistShare,
    },
    ipfsHash: indexedCampaign.ipfsHash || '',
    coverImage: indexedCampaign.coverImageUrl || null,
    status: campaignStatus,
    campaignContract: indexedCampaign.campaignContract,
  };
}

export const campaignsApi = {
  createCampaign: async (payload: CreateCampaignPayload) => {
    // Still use backend API for creating campaigns
    const response = await apiClient.post('/campaigns', payload);
    return response.data;
  },

  /**
   * Get all campaigns from the GraphQL indexer
   */
  getCampaigns: async (params?: Record<string, string | number | undefined>) => {
    try {
      // Fetch campaigns and artists in parallel
      const [campaignsData, artistsData] = await Promise.all([
        graphqlQuery<GetAllCampaignsResponse>(CAMPAIGN_QUERIES.GET_ALL_CAMPAIGNS),
        graphqlQuery<GetAllArtistsResponse>(ARTIST_QUERIES.GET_ALL_ARTISTS),
      ]);

      // Create a map of artist addresses to names for quick lookup
      const artistMap = new Map<string, string>();
      artistsData.ArtistIdentity_ArtistRegistered.forEach((artist) => {
        artistMap.set(artist.artist.toLowerCase(), artist.name);
      });

      // Map campaigns and join with artist names
      const campaigns = campaignsData.CampaignRegistry_CampaignCreated.map((campaign, index) => {
        const artistName = artistMap.get(campaign.artist.toLowerCase());
        return mapIndexedCampaignToListItem(campaign, index, artistName);
      });

      // Apply filters if provided
      let filteredCampaigns = campaigns;

      if (params?.artist) {
        filteredCampaigns = filteredCampaigns.filter(
          (c) => c.artistId.toLowerCase() === String(params.artist).toLowerCase()
        );
      }

      return {
        campaigns: filteredCampaigns,
        pagination: {
          page: 1,
          limit: filteredCampaigns.length,
          total: filteredCampaigns.length,
        },
      };
    } catch (error) {
      console.error('Error fetching campaigns from indexer:', error);
      // Fallback to empty result
      return {
        campaigns: [],
        pagination: { page: 1, limit: 0, total: 0 },
      };
    }
  },

  /**
   * Get single campaign by ID from the GraphQL indexer
   */
  getCampaignById: async (id: string | number) => {
    try {
      // Convert ID to number for GraphQL query (campaignId is numeric in database)
      const campaignId = typeof id === 'string' ? parseInt(id, 10) : id;

      if (isNaN(campaignId)) {
        throw new Error(`Invalid campaign ID: ${id}`);
      }

      // Fetch campaign and all artists
      const [campaignData, artistsData] = await Promise.all([
        graphqlQuery<GetCampaignByIdResponse>(
          CAMPAIGN_QUERIES.GET_CAMPAIGN_BY_ID,
          { campaignId }
        ),
        graphqlQuery<GetAllArtistsResponse>(ARTIST_QUERIES.GET_ALL_ARTISTS),
      ]);

      if (campaignData.CampaignRegistry_CampaignCreated.length === 0) {
        throw new Error(`Campaign with ID ${id} not found`);
      }

      const campaign = campaignData.CampaignRegistry_CampaignCreated[0];

      // Find the artist name for this campaign
      const artist = artistsData.ArtistIdentity_ArtistRegistered.find(
        (a) => a.artist.toLowerCase() === campaign.artist.toLowerCase()
      );

      return mapIndexedCampaignToListItem(campaign, 0, artist?.name);
    } catch (error) {
      console.error(`Error fetching campaign ${id} from indexer:`, error);
      throw error;
    }
  },
};

export default campaignsApi;
