import { apiClient } from './privyAuth';

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
}

export interface CampaignListResponse {
  campaigns: CampaignListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const campaignsApi = {
  createCampaign: async (payload: CreateCampaignPayload) => {
    const response = await apiClient.post('/campaigns', payload);
    return response.data;
  },
  getCampaigns: async (params?: Record<string, string | number | undefined>) => {
    const response = await apiClient.get<CampaignListResponse>('/campaigns', {
      params,
    });
    return response.data;
  },
  getCampaignById: async (id: string | number) => {
    const response = await apiClient.get<{ campaign: CampaignListItem }>(`/campaigns/${id}`);
    return response.data.campaign;
  },
};

export default campaignsApi;
