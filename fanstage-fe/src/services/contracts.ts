import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseEther, parseUnits } from 'viem';
import ArtistIdentityABI from '../contracts/ABI/ArtistIdentity.json';
import CampaignRegistryABI from '../contracts/ABI/CampaignRegistry.json';
import CampaignContractABI from '../contracts/ABI/CampaignContract.json';
import MockIDRXABI from '../contracts/ABI/MockIDRX.json';
import contractAddresses from '../contracts/addresses.json';

const ADDRESSES = contractAddresses.baseSepolia;

// Campaign Status Enum (matches contract)
export enum CampaignStatus {
  ONGOING = 0,
  FUNDED = 1,
  COMPLETED = 2,
  FAILED = 3,
}

// Contract configurations
const artistIdentityConfig = {
  address: ADDRESSES.ArtistIdentity as `0x${string}`,
  abi: ArtistIdentityABI,
  chainId: baseSepolia.id,
};

const campaignRegistryConfig = {
  address: ADDRESSES.CampaignRegistry as `0x${string}`,
  abi: CampaignRegistryABI,
  chainId: baseSepolia.id,
};

const mockIdrxConfig = {
  address: ADDRESSES.MockIDRX as `0x${string}`,
  abi: MockIDRXABI,
  chainId: baseSepolia.id,
};

export type Tier = {
  name: string;
  threshold: string;
  profitPercent: number;
  benefits: string;
};

export const useIsRegisteredArtist = (artistAddress: `0x${string}`) => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'isRegisteredArtist',
    args: [artistAddress],
  });
};

export const useArtistProfile = (artistAddress: `0x${string}`) => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'getArtistProfile',
    args: [artistAddress],
  });
};

export const useAllArtists = () => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'getAllArtists',
  });
};

export const useArtistTokenId = (artistAddress: `0x${string}`) => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'getArtistTokenId',
    args: [artistAddress],
  });
};

export const useArtistByTokenId = (tokenId: bigint) => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'getArtistByTokenId',
    args: [tokenId],
  });
};

export const useArtistProfileByTokenId = (tokenId: bigint) => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'getArtistProfileByTokenId',
    args: [tokenId],
  });
};

export const useTotalArtists = () => {
  return useReadContract({
    ...artistIdentityConfig,
    functionName: 'totalArtists',
  });
};

export const useRegisterArtist = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();
  
  const registerArtist = async (artistName: string, metadataURI: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    writeContract({
      address: artistIdentityConfig.address,
      abi: artistIdentityConfig.abi,
      functionName: 'registerArtist',
      args: [artistName, metadataURI],
      chain: baseSepolia,
      account: address,
    });
  };

  return { registerArtist, hash, error, isPending };
};

export const useUpdateProfile = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();
  
  const updateProfile = async (newName: string, metadataURI: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    writeContract({
      address: artistIdentityConfig.address,
      abi: artistIdentityConfig.abi,
      functionName: 'updateProfile',
      args: [newName, metadataURI],
      chain: baseSepolia,
      account: address,
    });
  };

  return { updateProfile, hash, error, isPending };
};

// Campaign Registry contract hooks
export const useCampaignContract = (campaignId: number) => {
  return useReadContract({
    ...campaignRegistryConfig,
    functionName: 'campaignContracts',
    args: [BigInt(campaignId)],
  });
};

export const useCampaignCounter = () => {
  return useReadContract({
    ...campaignRegistryConfig,
    functionName: 'campaignCounter',
  });
};

export const useCampaignCreationFee = () => {
  return useReadContract({
    ...campaignRegistryConfig,
    functionName: 'campaignCreationFee',
  });
};

export const useCreateCampaign = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();
  
  const createCampaign = async (
    ipfsHash: string,
    targetAmount: string,
    duration: number,
    funderSharePercent: number,
    tiers: Tier[],
    artistTokenName: string,
    campaignNftName: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    const targetAmountWei = parseUnits(targetAmount, 2);

    return writeContract({
      address: campaignRegistryConfig.address,
      abi: campaignRegistryConfig.abi,
      functionName: 'createCampaign',
      args: [
        ipfsHash,
        targetAmountWei,
        BigInt(duration),
        BigInt(funderSharePercent),
        tiers.map(tier => ({
          name: tier.name,
          threshold: parseUnits(tier.threshold, 2),
          profitPercent: BigInt(tier.profitPercent),
          benefits: tier.benefits,
        })),
        artistTokenName,
        campaignNftName,
      ],
      chain: baseSepolia,
      account: address,
    });
  };

  return { createCampaign, hash, error, isPending };
};

// Mock IDRX token hooks
export const useIdrxBalance = (address: `0x${string}`) => {
  const { data } = useReadContract({
    ...mockIdrxConfig,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  return data ? (Number(data) / 1e2).toFixed(2) : '0';
};

export const useIdrxAllowance = (owner: `0x${string}`, spender: `0x${string}`) => {
  const { data } = useReadContract({
    ...mockIdrxConfig,
    functionName: 'allowance',
    args: [owner, spender],
    watch: true,
  });

  return data ? (Number(data) / 1e2).toFixed(2) : '0';
};

export const useIdrxTotalSupply = () => {
  const { data } = useReadContract({
    ...mockIdrxConfig,
    functionName: 'totalSupply',
    watch: true,
  });

  return data ? (Number(data) / 1e2).toFixed(2) : '0';
};

export const useMintIdrx = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const mint = async (toAddress: `0x${string}`, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, 2);

    writeContract({
      address: mockIdrxConfig.address,
      abi: mockIdrxConfig.abi,
      functionName: 'mint',
      args: [toAddress, amountWei],
      chain: baseSepolia,
      account: address,
    });
  };

  return { mint, hash, error, isPending };
};

export const useApproveIdrx = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const approve = async (spender: `0x${string}`, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, 2);

    writeContract({
      address: mockIdrxConfig.address,
      abi: mockIdrxConfig.abi,
      functionName: 'approve',
      args: [spender, amountWei],
      chain: baseSepolia,
      account: address,
    });
  };

  return { approve, hash, error, isPending };
};

export const useTransferIdrx = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const transfer = async (to: `0x${string}`, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, 2);

    writeContract({
      address: mockIdrxConfig.address,
      abi: mockIdrxConfig.abi,
      functionName: 'transfer',
      args: [to, amountWei],
      chain: baseSepolia,
      account: address,
    });
  };

  return { transfer, hash, error, isPending };
};

// Campaign Contract hooks for funding
export const useCampaignData = (campaignContractAddress: `0x${string}`) => {
  return useReadContract({
    address: campaignContractAddress,
    abi: CampaignContractABI,
    functionName: 'getCampaignData',
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(campaignContractAddress && campaignContractAddress !== '0x'),
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });
};

export const useCampaignFundersCount = (campaignContractAddress: `0x${string}`) => {
  return useReadContract({
    address: campaignContractAddress,
    abi: CampaignContractABI,
    functionName: 'getTotalFunders',
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(campaignContractAddress && campaignContractAddress !== '0x'),
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });
};

export const useFundCampaign = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const fund = async (campaignContractAddress: `0x${string}`, amount: string) => {
    if (!address) throw new Error('Wallet not connected');

    const amountWei = parseUnits(amount, 2);

    writeContract({
      address: campaignContractAddress,
      abi: CampaignContractABI,
      functionName: 'fund',
      args: [amountWei],
      chain: baseSepolia,
      account: address,
    });
  };

  return { fund, hash, error, isPending };
};

export const useIdrxAllowanceForCampaign = (owner: `0x${string}`, campaignContract: `0x${string}`) => {
  return useIdrxAllowance(owner, campaignContract);
};

export const useApproveIdrxForCampaign = () => {
  const { approve, hash, error, isPending } = useApproveIdrx();

  const approveForCampaign = async (campaignContract: `0x${string}`, amount: string) => {
    await approve(campaignContract, amount);
  };

  return { approveForCampaign, hash, error, isPending };
};

// Submit Revenue hooks for artists
export const useSubmitRevenue = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const submitRevenue = async (campaignContractAddress: `0x${string}`) => {
    if (!address) throw new Error('Wallet not connected');

    writeContract({
      address: campaignContractAddress,
      abi: CampaignContractABI,
      functionName: 'submitRevenue',
      args: [], // No parameters - uses contract balance
      chain: baseSepolia,
      account: address,
    });
  };

  return { submitRevenue, hash, error, isPending };
};

// Claim Revenue hooks for backers
export const useClaimableRevenue = (campaignContract: `0x${string}`, backerAddress: `0x${string}`) => {
  const { data } = useReadContract({
    address: campaignContract,
    abi: CampaignContractABI,
    functionName: 'claimableRevenue',
    args: [backerAddress],
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(campaignContract && campaignContract !== '0x' && backerAddress),
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });

  return data ? (Number(data) / 1e2).toFixed(2) : '0';
};

export const useTotalFunded = (campaignContract: `0x${string}`, backerAddress: `0x${string}`) => {
  const { data } = useReadContract({
    address: campaignContract,
    abi: CampaignContractABI,
    functionName: 'totalFunded',
    args: [backerAddress],
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(campaignContract && campaignContract !== '0x' && backerAddress),
      refetchInterval: 5000,
    },
  });

  return data ? (Number(data) / 1e2).toFixed(2) : '0';
};

export const useClaimRevenue = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();

  const claimRevenue = async (campaignContractAddress: `0x${string}`) => {
    if (!address) throw new Error('Wallet not connected');

    writeContract({
      address: campaignContractAddress,
      abi: CampaignContractABI,
      functionName: 'claimRevenue',
      args: [], // No parameters - uses msg.sender
      chain: baseSepolia,
      account: address,
    });
  };

  return { claimRevenue, hash, error, isPending };
};

// Transaction receipt hook
export const useTransactionReceipt = (hash: `0x${string}` | undefined) => {
  return useWaitForTransactionReceipt({
    hash,
  });
};

// Export contract addresses and configurations for reference
export { ADDRESSES };
export const CONTRACT_CONFIGS = {
  ArtistIdentity: artistIdentityConfig,
  CampaignRegistry: campaignRegistryConfig,
  MockIDRX: mockIdrxConfig,
};
