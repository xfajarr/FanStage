/**
 * GraphQL Client for Envio Indexer
 * Fetches blockchain data from the indexer instead of backend API
 */

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8081/v1/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;
}

/**
 * Generic GraphQL query function
 */
export async function graphqlQuery<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`
      );
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL Query Error:', error);
    throw error;
  }
}

/**
 * GraphQL Queries for Campaign Data
 */
export const CAMPAIGN_QUERIES = {
  // Get all campaigns
  GET_ALL_CAMPAIGNS: `
    query GetAllCampaigns {
      CampaignRegistry_CampaignCreated {
        id
        campaignId
        artist
        campaignContract
        ipfsHash
        targetAmount
        totalRaised
        deadline
        funderSharePercent
        status
        fundingProgress
        isActive
        title
        summary
        story
        coverImageUrl
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get campaign by ID (campaignId is numeric in database)
  GET_CAMPAIGN_BY_ID: `
    query GetCampaignById($campaignId: numeric!) {
      CampaignRegistry_CampaignCreated(
        where: { campaignId: { _eq: $campaignId } }
      ) {
        id
        campaignId
        artist
        campaignContract
        ipfsHash
        targetAmount
        totalRaised
        deadline
        funderSharePercent
        status
        fundingProgress
        isActive
        title
        summary
        story
        coverImageUrl
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get campaigns by artist
  GET_CAMPAIGNS_BY_ARTIST: `
    query GetCampaignsByArtist($artist: String!) {
      CampaignRegistry_CampaignCreated(
        where: { artist: { _eq: $artist } }
      ) {
        id
        campaignId
        artist
        campaignContract
        ipfsHash
        targetAmount
        totalRaised
        deadline
        funderSharePercent
        status
        fundingProgress
        isActive
        title
        summary
        story
        coverImageUrl
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,
};

/**
 * GraphQL Response Types
 */
export interface IndexedCampaign {
  id: string;
  campaignId: string;
  artist: string;
  campaignContract: string;
  ipfsHash: string | null;
  targetAmount: string | null;
  totalRaised: string | null;
  deadline: string | null;
  funderSharePercent: string | null;
  status: string | null;
  fundingProgress: string | null;
  isActive: boolean | null;
  title: string | null;
  summary: string | null;
  story: string | null;
  coverImageUrl: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GetAllCampaignsResponse {
  CampaignRegistry_CampaignCreated: IndexedCampaign[];
}

export interface GetCampaignByIdResponse {
  CampaignRegistry_CampaignCreated: IndexedCampaign[];
}

/**
 * GraphQL Queries for Artist Data
 */
export const ARTIST_QUERIES = {
  // Get all registered artists
  GET_ALL_ARTISTS: `
    query GetAllArtists {
      ArtistIdentity_ArtistRegistered {
        id
        artist
        tokenId
        name
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get artist by wallet address
  GET_ARTIST_BY_ADDRESS: `
    query GetArtistByAddress($artist: String!) {
      ArtistIdentity_ArtistRegistered(
        where: { artist: { _eq: $artist } }
      ) {
        id
        artist
        tokenId
        name
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,
};

/**
 * Artist Response Types
 */
export interface IndexedArtist {
  id: string;
  artist: string;
  tokenId: string;
  name: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GetAllArtistsResponse {
  ArtistIdentity_ArtistRegistered: IndexedArtist[];
}

export interface GetArtistByAddressResponse {
  ArtistIdentity_ArtistRegistered: IndexedArtist[];
}

/**
 * GraphQL Queries for Fan Activity Data
 */
export const FAN_QUERIES = {
  // Get all investments by a fan
  GET_FAN_INVESTMENTS: `
    query GetFanInvestments($funder: String!) {
      CampaignContract_FundingReceived(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        funder
        amount
        tier
        tokenId
        campaignContract
        campaignId
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get all tier badges earned by a fan
  GET_FAN_BADGES: `
    query GetFanBadges($funder: String!) {
      CampaignContract_TierBadgeMinted(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        funder
        tierId
        tierName
        campaignContract
        campaignId
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get all revenue claims by a fan
  GET_FAN_REVENUE_CLAIMS: `
    query GetFanRevenueClaims($funder: String!) {
      CampaignContract_RevenueClaimed(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        funder
        amount
        campaignContract
        campaignId
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get all refunds claimed by a fan
  GET_FAN_REFUNDS: `
    query GetFanRefunds($funder: String!) {
      CampaignContract_RefundClaimed(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        funder
        amount
        campaignContract
        campaignId
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get comprehensive fan activity (investments + badges + claims)
  GET_FAN_ACTIVITY: `
    query GetFanActivity($funder: String!) {
      investments: CampaignContract_FundingReceived(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        amount
        tier
        tokenId
        campaignContract
        campaignId
        blockTimestamp
        transactionHash
      }
      badges: CampaignContract_TierBadgeMinted(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        tierId
        tierName
        campaignContract
        campaignId
        blockTimestamp
        transactionHash
      }
      revenueClaims: CampaignContract_RevenueClaimed(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        amount
        campaignContract
        campaignId
        blockTimestamp
        transactionHash
      }
      refunds: CampaignContract_RefundClaimed(
        where: { funder: { _eq: $funder } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        amount
        campaignContract
        campaignId
        blockTimestamp
        transactionHash
      }
    }
  `,
};

/**
 * Fan Activity Response Types
 */
export interface IndexedFundingReceived {
  id: string;
  funder: string;
  amount: string;
  tier: number;
  tokenId: string;
  campaignContract: string;
  campaignId: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface IndexedTierBadge {
  id: string;
  funder: string;
  tierId: string;
  tierName: string;
  campaignContract: string;
  campaignId: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface IndexedRevenueClaim {
  id: string;
  funder: string;
  amount: string;
  campaignContract: string;
  campaignId: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface IndexedRefund {
  id: string;
  funder: string;
  amount: string;
  campaignContract: string;
  campaignId: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GetFanInvestmentsResponse {
  CampaignContract_FundingReceived: IndexedFundingReceived[];
}

export interface GetFanBadgesResponse {
  CampaignContract_TierBadgeMinted: IndexedTierBadge[];
}

export interface GetFanRevenueClaimsResponse {
  CampaignContract_RevenueClaimed: IndexedRevenueClaim[];
}

export interface GetFanRefundsResponse {
  CampaignContract_RefundClaimed: IndexedRefund[];
}

export interface GetFanActivityResponse {
  investments: IndexedFundingReceived[];
  badges: IndexedTierBadge[];
  revenueClaims: IndexedRevenueClaim[];
  refunds: IndexedRefund[];
}

/**
 * GraphQL Queries for Artist Token Holdings
 */
export const TOKEN_QUERIES = {
  // Get artist token holdings by fan (tokens received via minting)
  GET_FAN_TOKEN_HOLDINGS: `
    query GetFanTokenHoldings($fanAddress: String!) {
      ArtistToken_Transfer(
        where: { 
          to: { _eq: $fanAddress }
          from: { _eq: "0x0000000000000000000000000000000000000000" }
        }
        order_by: { blockTimestamp: desc }
      ) {
        id
        from
        to
        value
        artistToken
        campaignContract
        campaignId
        tokenName
        tokenSymbol
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get artist token transfers for a specific fan (includes burns/transfers out)
  GET_FAN_TOKEN_TRANSFERS: `
    query GetFanTokenTransfers($fanAddress: String!) {
      ArtistToken_Transfer(
        where: { 
          _or: [
            { from: { _eq: $fanAddress } }
            { to: { _eq: $fanAddress } }
          ]
        }
        order_by: { blockTimestamp: desc }
      ) {
        id
        from
        to
        value
        artistToken
        campaignContract
        campaignId
        tokenName
        tokenSymbol
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get all tokens for a specific artist (by campaign contracts they own)
  GET_ARTIST_TOKENS: `
    query GetArtistTokens($campaignContracts: [String!]!) {
      ArtistToken_Transfer(
        where: { 
          campaignContract: { _in: $campaignContracts }
          from: { _eq: "0x0000000000000000000000000000000000000000" }
        }
        order_by: { blockTimestamp: desc }
      ) {
        id
        to
        value
        artistToken
        campaignContract
        campaignId
        tokenName
        tokenSymbol
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get token supply for specific artist tokens
  GET_TOKEN_SUPPLY: `
    query GetTokenSupply($artistTokens: [String!]!) {
      mints: ArtistToken_Transfer(
        where: { 
          artistToken: { _in: $artistTokens }
          from: { _eq: "0x0000000000000000000000000000000000000000" }
        }
      ) {
        artistToken
        tokenName
        tokenSymbol
        value
      }
      burns: ArtistToken_Transfer(
        where: { 
          artistToken: { _in: $artistTokens }
          to: { _eq: "0x0000000000000000000000000000000000000000" }
        }
      ) {
        artistToken
        value
      }
    }
  `,
};

/**
 * Artist Token Response Types
 */
export interface IndexedTokenTransfer {
  id: string;
  from: string;
  to: string;
  value: string;
  artistToken: string;
  campaignContract: string | null;
  campaignId: string | null;
  tokenName: string | null;
  tokenSymbol: string | null;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GetFanTokenHoldingsResponse {
  ArtistToken_Transfer: IndexedTokenTransfer[];
}

export interface GetFanTokenTransfersResponse {
  ArtistToken_Transfer: IndexedTokenTransfer[];
}

export interface GetArtistTokensResponse {
  ArtistToken_Transfer: IndexedTokenTransfer[];
}

export interface GetTokenSupplyResponse {
  mints: IndexedTokenTransfer[];
  burns: IndexedTokenTransfer[];
}

/**
 * GraphQL Queries for IDRX On/Off-Ramp Events
 */
export const IDRX_QUERIES = {
  // Get all on-ramp transactions for a user
  GET_USER_ONRAMP_HISTORY: `
    query GetUserOnRampHistory($userAddress: String!) {
      MockIDRX_OnRamp(
        where: { user: { _eq: $userAddress } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        user
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get all off-ramp transactions for a user
  GET_USER_OFFRAMP_HISTORY: `
    query GetUserOffRampHistory($userAddress: String!) {
      MockIDRX_OffRamp(
        where: { user: { _eq: $userAddress } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        user
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  // Get combined on/off-ramp history for a user
  GET_USER_IDRX_HISTORY: `
    query GetUserIDRXHistory($userAddress: String!) {
      onRamps: MockIDRX_OnRamp(
        where: { user: { _eq: $userAddress } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        user
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
      offRamps: MockIDRX_OffRamp(
        where: { user: { _eq: $userAddress } }
        order_by: { blockTimestamp: desc }
      ) {
        id
        user
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,
};

/**
 * IDRX Transaction Response Types
 */
export interface IndexedIDRXTransaction {
  id: string;
  user: string;
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GetUserOnRampHistoryResponse {
  MockIDRX_OnRamp: IndexedIDRXTransaction[];
}

export interface GetUserOffRampHistoryResponse {
  MockIDRX_OffRamp: IndexedIDRXTransaction[];
}

export interface GetUserIDRXHistoryResponse {
  onRamps: IndexedIDRXTransaction[];
  offRamps: IndexedIDRXTransaction[];
}
