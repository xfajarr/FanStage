export type UserRole = 'fan' | 'artist' | 'agency';

export type ArtistTier = 'senior' | 'rising-star';

export type ArtistCategory = 'senior_star' | 'rising_star';

// Backend user profile response type
export interface UserProfile {
  walletAddress: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  bio: string | null;
  profileImageUrl: string | null;
  artistCategory: ArtistCategory | null;
  socialMediaLinks: string | null;
  createdAt: string;
}

// Legacy User interface for backward compatibility
export interface User {
  id: string;
  walletAddress: string;
  role: UserRole;
  name: string;
  avatar?: string;
  bio?: string;
  artistTier?: ArtistTier;
  verified: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    spotify?: string;
  };
}

export interface Campaign {
  id: string;
  artistId: string;
  artistName: string;
  artistAvatar: string;
  title: string;
  description: string;
  category: 'concert' | 'album' | 'tour' | 'music-video' | 'other';
  fundingGoal: number;
  currentFunding: number;
  backerCount: number;
  startDate: string;
  endDate: string;
  profitShare: {
    fan: number;
    artist: number;
  };
  rewards: RewardTier[];
  ipfsHash: string;
  coverImage: string;
  status: 'active' | 'funded' | 'completed' | 'failed';
}

export interface RewardTier {
  id: string;
  name: string;
  minInvestment: number;
  benefits: string[];
  nftImage?: string;
  limited?: boolean;
  available?: number;
}

export interface NFT {
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

export interface Investment {
  id: string;
  campaignId: string;
  campaignTitle: string;
  artistName: string;
  amount: number;
  date: string;
  profitShare: number;
  status: 'active' | 'completed';
  earnedProfit?: number;
}

export interface StakingPosition {
  id: string;
  artistId: string;
  artistName: string;
  tokenSymbol: string;
  stakedAmount: number;
  apy: number;
  startDate: string;
  earnedYield: number;
  status: 'active' | 'unstaking';
}

export interface FanToken {
  id: string;
  artistId: string;
  artistName: string;
  symbol: string;
  totalSupply: number;
  currentPrice: number;
  marketCap: number;
  holders: number;
  change24h: number;
}
