/*
 * FanStage Campaign Indexer - Event Handlers
 * Enhanced version with Effects API for fetching campaign data from contracts
 */

import {
  CampaignRegistry,
  CampaignRegistry_CampaignCreated,
  ArtistIdentity,
  ArtistIdentity_ArtistRegistered,
  CampaignContract,
  CampaignContract_FundingReceived,
  CampaignContract_TierBadgeMinted,
  CampaignContract_RevenueClaimed,
  CampaignContract_RefundClaimed,
  CampaignContract_RevenueSubmitted,
  CampaignContract_RevenueDistributed,
  CampaignContract_CampaignFunded,
  ArtistToken,
  ArtistToken_Transfer,
  MockIDRX,
  MockIDRX_OnRamp,
  MockIDRX_OffRamp,
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

  // This data will be available to the contractRegister handler

  if (campaignData) {
    context.log.info(
      `✅ Indexed campaign #${campaignId} with complete data - Status: ${entity.status}, Progress: ${fundingProgress}%. Campaign contract registered for dynamic indexing.`
    );
  } else {
    context.log.info(`✅ Indexed campaign #${campaignId} (event data only). Campaign contract registered for dynamic indexing.`);
  }
});

/**
 * Contract Registration Handler for CampaignCreated events
 * Dynamically registers new campaign contracts for indexing
 */
CampaignRegistry.CampaignCreated.contractRegister(({ event, context }) => {
  const { campaignContract } = event.params;
  
  // Register the new campaign contract for dynamic indexing
  context.addCampaignContract(campaignContract);
  
  context.log.info(`🎯 Registered new campaign contract: ${campaignContract}`);
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

/**
 * Helper function to get campaign ID from campaign contract address
 * This would typically involve a registry lookup
 */
const getCampaignIdFromContract = async (campaignContract: string, context: any): Promise<bigint> => {
  // For now, we'll derive it from a simple lookup - in production this should 
  // query the registry contract or maintain a mapping
  // TODO: Implement proper registry lookup
  return 0n; // Placeholder
};

/**
 * Handler for FundingReceived events from campaign contracts
 * Tracks fan investments in campaigns
 */
CampaignContract.FundingReceived.handler(async ({ event, context }) => {
  const { funder, amount, tier, tokenId } = event.params;
  
  context.log.info(`Processing funding: ${funder} invested ${amount} wei`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_FundingReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    funder: funder.toLowerCase(),
    amount: amount,
    tier: Number(tier),
    tokenId: tokenId,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_FundingReceived.set(entity);
  context.log.info(`✅ Indexed funding: ${funder} -> ${amount} wei`);
});

/**
 * Handler for TierBadgeMinted events from campaign contracts
 * Tracks NFT badges earned by fans
 */
CampaignContract.TierBadgeMinted.handler(async ({ event, context }) => {
  const { funder, tierId, tierName } = event.params;
  
  context.log.info(`Processing badge: ${funder} earned ${tierName} badge`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_TierBadgeMinted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    funder: funder.toLowerCase(),
    tierId: tierId,
    tierName: tierName,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_TierBadgeMinted.set(entity);
  context.log.info(`✅ Indexed badge: ${funder} -> ${tierName}`);
});

/**
 * Handler for RevenueClaimed events from campaign contracts
 * Tracks fan revenue claims from successful campaigns
 */
CampaignContract.RevenueClaimed.handler(async ({ event, context }) => {
  const { funder, amount } = event.params;
  
  context.log.info(`Processing revenue claim: ${funder} claimed ${amount} wei`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_RevenueClaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    funder: funder.toLowerCase(),
    amount: amount,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_RevenueClaimed.set(entity);
  context.log.info(`✅ Indexed revenue claim: ${funder} -> ${amount} wei`);
});

/**
 * Handler for RefundClaimed events from campaign contracts
 * Tracks fan refunds from failed campaigns
 */
CampaignContract.RefundClaimed.handler(async ({ event, context }) => {
  const { funder, amount } = event.params;
  
  context.log.info(`Processing refund: ${funder} refunded ${amount} wei`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_RefundClaimed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    funder: funder.toLowerCase(),
    amount: amount,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_RefundClaimed.set(entity);
  context.log.info(`✅ Indexed refund: ${funder} -> ${amount} wei`);
});

/**
 * Handler for RevenueSubmitted events from campaign contracts
 * Tracks when artists submit revenue for distribution
 */
CampaignContract.RevenueSubmitted.handler(async ({ event, context }) => {
  const { revenueAmount } = event.params;
  
  context.log.info(`Processing revenue submission: ${revenueAmount} wei`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_RevenueSubmitted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    revenueAmount: revenueAmount,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_RevenueSubmitted.set(entity);
  context.log.info(`✅ Indexed revenue submission: ${revenueAmount} wei`);
});

/**
 * Handler for RevenueDistributed events from campaign contracts
 * Tracks revenue distribution between artist and funders
 */
CampaignContract.RevenueDistributed.handler(async ({ event, context }) => {
  const { artist, artistShare, funderPoolAmount } = event.params;
  
  context.log.info(`Processing revenue distribution: Artist ${artistShare} wei, Funders ${funderPoolAmount} wei`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_RevenueDistributed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    artist: artist.toLowerCase(),
    artistShare: artistShare,
    funderPoolAmount: funderPoolAmount,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_RevenueDistributed.set(entity);
  context.log.info(`✅ Indexed revenue distribution`);
});

/**
 * Handler for CampaignFunded events from campaign contracts
 * Tracks when campaigns reach their funding goals
 */
CampaignContract.CampaignFunded.handler(async ({ event, context }) => {
  const { totalRaised } = event.params;
  
  context.log.info(`Processing campaign funding completion: ${totalRaised} wei raised`);
  
  const campaignId = await getCampaignIdFromContract(event.srcAddress, context);
  
  const entity: CampaignContract_CampaignFunded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    totalRaised: totalRaised,
    
    // Contract context
    campaignContract: event.srcAddress.toLowerCase(),
    campaignId: campaignId,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.CampaignContract_CampaignFunded.set(entity);
  context.log.info(`✅ Indexed campaign funding completion: ${totalRaised} wei`);
});

// ABI for ERC20 token metadata functions
const ARTIST_TOKEN_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol", 
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Effect to fetch artist token metadata
 * Gets token name and symbol from the ArtistToken contract
 */
const fetchArtistTokenMetadata = experimental_createEffect(
  {
    name: "fetchArtistTokenMetadata",
    input: {
      artistTokenAddress: S.string,
    },
    output: {
      tokenName: S.string,
      tokenSymbol: S.string,
      campaignContract: S.string,
    },
    rateLimit: { calls: 10, per: "second" },
    cache: true,
  },
  async ({ input }) => {
    const { artistTokenAddress } = input;

    // Create viem public client
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    try {
      // Fetch token metadata in parallel
      const [name, symbol, owner] = await Promise.all([
        client.readContract({
          address: artistTokenAddress as `0x${string}`,
          abi: ARTIST_TOKEN_ABI,
          functionName: "name",
        }),
        client.readContract({
          address: artistTokenAddress as `0x${string}`,
          abi: ARTIST_TOKEN_ABI,
          functionName: "symbol",
        }),
        client.readContract({
          address: artistTokenAddress as `0x${string}`,
          abi: ARTIST_TOKEN_ABI,
          functionName: "owner",
        }),
      ]);

      return {
        tokenName: name as string,
        tokenSymbol: symbol as string,
        campaignContract: (owner as string).toLowerCase(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch artist token metadata: ${error}`);
    }
  }
);

/**
 * Handler for ArtistToken Transfer events
 * Tracks artist token holdings for fans (minting when they invest)
 * The owner() of ArtistToken is the CampaignContract
 */
ArtistToken.Transfer.handler(async ({ event, context }) => {
  const { from, to, value } = event.params;
  
  // Skip zero-value transfers
  if (value === 0n) {
    return;
  }
  
  const isTokenMint = from === "0x0000000000000000000000000000000000000000";
  const isTokenBurn = to === "0x0000000000000000000000000000000000000000";
  
  const transferType = isTokenMint ? "minting" : isTokenBurn ? "burning" : "transfer";
  context.log.info(`Processing artist token ${transferType}: ${value} tokens from ${from} to ${to}`);
  
  // Fetch token metadata to identify associated campaign
  let tokenMetadata;
  try {
    tokenMetadata = await context.effect(fetchArtistTokenMetadata, {
      artistTokenAddress: event.srcAddress,
    });
    context.log.info(`✅ Token metadata: ${tokenMetadata.tokenName} (${tokenMetadata.tokenSymbol})`);
  } catch (error) {
    context.log.warn(`⚠️ Failed to fetch token metadata for ${event.srcAddress}: ${error}`);
    tokenMetadata = undefined;
  }
  
  // Look up campaign ID from the campaign contract (token owner)
  const campaignId = await getCampaignIdFromContract(
    tokenMetadata?.campaignContract || "unknown",
    context
  );
  
  const entity: ArtistToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    value: value,
    
    // Contract context
    artistToken: event.srcAddress.toLowerCase(),
    campaignContract: tokenMetadata?.campaignContract,
    campaignId: campaignId > 0n ? campaignId : undefined,
    
    // Token metadata
    tokenName: tokenMetadata?.tokenName,
    tokenSymbol: tokenMetadata?.tokenSymbol,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.ArtistToken_Transfer.set(entity);
  
  const tokenAmount = (Number(value) / 100).toFixed(2); // Convert from 2 decimals to display format
  context.log.info(
    `✅ Indexed artist token ${transferType}: ${tokenAmount} ${tokenMetadata?.tokenSymbol || "tokens"} ${from} -> ${to}`
  );
});

/**
 * Contract Registration Handler for CampaignCreated events (from CampaignContract)
 * Dynamically registers ArtistToken contracts created by each campaign
 * This is called when campaigns create their own ArtistToken instances
 */
CampaignContract.CampaignCreated.contractRegister(async ({ event, context }) => {
  // Extract the artist token address from the CampaignCreated event
  const { artistToken, artist, artistTokenName } = event.params;
  const campaignContract = event.srcAddress;
  
  context.log.info(`🎯 Campaign ${campaignContract} created by ${artist}`);
  context.log.info(`🪙 Registering ArtistToken contract: ${artistToken} (${artistTokenName})`);
  
  // Register the artist token contract for Transfer event indexing
  context.addArtistToken(artistToken);
  
  context.log.info(`✅ Successfully registered ArtistToken ${artistToken} for indexing`);
});

/**
 * Handler for OnRamp events from MockIDRX contract
 * Tracks when users purchase IDRX tokens
 */
MockIDRX.OnRamp.handler(async ({ event, context }) => {
  const { user, amount } = event.params;
  
  context.log.info(`Processing OnRamp: User ${user} purchased ${amount} IDRX`);
  
  const entity: MockIDRX_OnRamp = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    user: user.toLowerCase(),
    amount: amount,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.MockIDRX_OnRamp.set(entity);
  context.log.info(`✅ Indexed OnRamp transaction`);
});

/**
 * Handler for OffRamp events from MockIDRX contract
 * Tracks when users sell IDRX tokens
 */
MockIDRX.OffRamp.handler(async ({ event, context }) => {
  const { user, amount } = event.params;
  
  context.log.info(`Processing OffRamp: User ${user} sold ${amount} IDRX`);
  
  const entity: MockIDRX_OffRamp = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    
    // Event parameters
    user: user.toLowerCase(),
    amount: amount,
    
    // Event metadata
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.srcAddress,
  };
  
  context.MockIDRX_OffRamp.set(entity);
  context.log.info(`✅ Indexed OffRamp transaction`);
});
