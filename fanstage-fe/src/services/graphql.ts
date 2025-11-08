/**
 * GraphQL Client for Envio Indexer
 * Fetches blockchain data from the indexer instead of backend API
 */

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';

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
