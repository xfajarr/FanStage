/*
 * FanStage Campaign Indexer - Event Handlers
 * Enhanced version with Effects API for fetching campaign data from contracts
 */

import {
  CampaignRegistry,
  CampaignRegistry_CampaignCreated,
  ArtistIdentity,
  ArtistIdentity_ArtistRegistered,
} from "generated";
import { experimental_createEffect, S } from "envio";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// RPC endpoint for Base Sepolia
const RPC_URL = "https://sepolia.base.org";

// IPFS Gateway
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Campaign Status enum mapping (matches Solidity enum)
enum CampaignStatus {
  ONGOING = 0,
  FUNDED = 1,
  COMPLETED = 2,
  FAILED = 3,
}

const statusToString = (status: number): string => {
  switch (status) {
    case CampaignStatus.ONGOING:
      return "Active";
    case CampaignStatus.FUNDED:
      return "Funded";
    case CampaignStatus.COMPLETED:
      return "Completed";
    case CampaignStatus.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
};

// ABI for getCampaignData() function
const CAMPAIGN_ABI = [
  {
    inputs: [],
    name: "getCampaignData",
    outputs: [
      {
        components: [
          { name: "artist", type: "address" },
          { name: "funderSharePercent", type: "uint256" },
          { name: "ipfsHash", type: "string" },
          { name: "targetAmount", type: "uint256" },
          { name: "totalRaised", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "totalRevenue", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Effect to fetch campaign data from the campaign contract
 * Uses viem to call the getCampaignData() view function
 */
const fetchCampaignData = experimental_createEffect(
  {
    name: "fetchCampaignData",
    input: {
      campaignContract: S.string,
    },
    output: {
      artist: S.string,
      funderSharePercent: S.bigint,
      ipfsHash: S.string,
      targetAmount: S.bigint,
      totalRaised: S.bigint,
      deadline: S.bigint,
      status: S.number,
      totalRevenue: S.bigint,
      createdAt: S.bigint,
    },
    rateLimit: { calls: 10, per: "second" },
    cache: true,
  },
  async ({ input }) => {
    const { campaignContract } = input;

    // Create viem public client
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    // Call the contract
    const data = await client.readContract({
      address: campaignContract as `0x${string}`,
      abi: CAMPAIGN_ABI,
      functionName: "getCampaignData",
    });

    // Return formatted data (viem returns struct as object)
    return {
      artist: data.artist,
      funderSharePercent: data.funderSharePercent,
      ipfsHash: data.ipfsHash,
      targetAmount: data.targetAmount,
      totalRaised: data.totalRaised,
      deadline: data.deadline,
      status: Number(data.status),
      totalRevenue: data.totalRevenue,
      createdAt: data.createdAt,
    };
  }
);

/**
 * Effect to fetch campaign metadata from IPFS
 * Parses the IPFS hash and fetches JSON metadata
 */
const fetchIPFSMetadata = experimental_createEffect(
  {
    name: "fetchIPFSMetadata",
    input: {
      ipfsHash: S.string,
    },
    output: {
      title: S.string,
      summary: S.string,
      story: S.string,
      coverImageUrl: S.string,
    },
    rateLimit: { calls: 10, per: "second" },
    cache: true,
  },
  async ({ input }) => {
    const { ipfsHash } = input;

    // Convert ipfs:// to gateway URL
    // Format: ipfs://bafkrei... -> https://gateway.pinata.cloud/ipfs/bafkrei...
    const ipfsCID = ipfsHash.replace("ipfs://", "");
    const ipfsUrl = `${IPFS_GATEWAY}${ipfsCID}`;

    // Fetch metadata from IPFS
    const response = await fetch(ipfsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch IPFS metadata: ${response.statusText}`);
    }

    const metadata = (await response.json()) as {
      title?: string;
      summary?: string;
      story?: string;
      coverImageUrl?: string;
    };

    return {
      title: metadata.title || "",
      summary: metadata.summary || "",
      story: metadata.story || "",
      coverImageUrl: metadata.coverImageUrl || "",
    };
  }
);

/**
 * Handler for CampaignCreated events
 * Fetches complete campaign data from the contract using Effects API
 */
CampaignRegistry.CampaignCreated.handler(async ({ event, context }) => {
  const { campaignId, artist, campaignContract } = event.params;

  context.log.info(`Processing campaign #${campaignId} at ${campaignContract}`);

  // Fetch campaign data from the contract
  let campaignData;
  try {
    campaignData = await context.effect(fetchCampaignData, {
      campaignContract: campaignContract,
    });

    context.log.info(`✅ Fetched campaign data for #${campaignId}`);
  } catch (error) {
    context.log.warn(
      `⚠️ Failed to fetch campaign data for #${campaignId}: ${error}, storing event data only`
    );
    campaignData = undefined;
  }

  // Fetch IPFS metadata if ipfsHash is available
  let ipfsMetadata;
  if (campaignData?.ipfsHash) {
    try {
      ipfsMetadata = await context.effect(fetchIPFSMetadata, {
        ipfsHash: campaignData.ipfsHash,
      });

      context.log.info(`✅ Fetched IPFS metadata for #${campaignId}: ${ipfsMetadata.title}`);
    } catch (error) {
      context.log.warn(
        `⚠️ Failed to fetch IPFS metadata for #${campaignId}: ${error}`
      );
      ipfsMetadata = undefined;
    }
  }

  // Calculate funding progress if data is available
  let fundingProgress: bigint | undefined;
  let isActive: boolean | undefined;

  if (campaignData && campaignData.targetAmount > 0n) {
    fundingProgress = (campaignData.totalRaised * 100n) / campaignData.targetAmount;

    const now = BigInt(Math.floor(Date.now() / 1000));
    isActive =
      campaignData.status === CampaignStatus.ONGOING &&
      campaignData.deadline > now;
  }

  // Create entity with complete data
  const entity: CampaignRegistry_CampaignCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,

    // Event parameters
    campaignId: campaignId,
    artist: artist.toLowerCase(),
    campaignContract: campaignContract.toLowerCase(),

    // Enriched campaign data from contract
    ipfsHash: campaignData?.ipfsHash ?? undefined,
    targetAmount: campaignData?.targetAmount ?? undefined,
    totalRaised: campaignData?.totalRaised ?? undefined,
    deadline: campaignData?.deadline ?? undefined,
    funderSharePercent: campaignData?.funderSharePercent ?? undefined,
    status: campaignData ? statusToString(campaignData.status) : undefined,

    // IPFS metadata
    title: ipfsMetadata?.title ?? undefined,
    summary: ipfsMetadata?.summary ?? undefined,
    story: ipfsMetadata?.story ?? undefined,
    coverImageUrl: ipfsMetadata?.coverImageUrl ?? undefined,

    // Calculated fields
    fundingProgress: fundingProgress ?? undefined,
    isActive: isActive !== undefined ? isActive : undefined,

    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress, // Using srcAddress as transaction identifier since transaction.hash not available
  };

  // Save to database
  context.CampaignRegistry_CampaignCreated.set(entity);

  if (campaignData) {
    context.log.info(
      `✅ Indexed campaign #${campaignId} with complete data - Status: ${entity.status}, Progress: ${fundingProgress}%`
    );
  } else {
    context.log.info(`✅ Indexed campaign #${campaignId} (event data only)`);
  }
});

/**
 * Handler for ArtistRegistered events
 * Indexes artist profile data from the ArtistIdentity contract
 */
ArtistIdentity.ArtistRegistered.handler(async ({ event, context }) => {
  const { artist, tokenId, name } = event.params;

  context.log.info(`Processing artist registration: ${name} (${artist})`);

  // Create entity with artist data
  const entity: ArtistIdentity_ArtistRegistered = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,

    // Event parameters
    artist: artist.toLowerCase(),
    tokenId: tokenId,
    name: name,

    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };

  // Save to database
  context.ArtistIdentity_ArtistRegistered.set(entity);

  context.log.info(`✅ Indexed artist: ${name} (Token ID: ${tokenId})`);
});
