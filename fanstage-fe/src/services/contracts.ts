import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { parseEther, formatEther } from 'viem';
import ArtistIdentityABI from '../contracts/ABI/ArtistIdentity.json';
import CampaignRegistryABI from '../contracts/ABI/CampaignRegistry.json';
import MockIDRXABI from '../contracts/ABI/MockIDRX.json';
import contractAddresses from '../contracts/addresses.json';

const ADDRESSES = contractAddresses.baseSepolia;

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
    
    const targetAmountWei = parseEther(targetAmount);
    
    writeContract({
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
          threshold: parseEther(tier.threshold),
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
  });
  
  return data ? formatEther(data as bigint) : '0';
};

export const useIdrxAllowance = (owner: `0x${string}`, spender: `0x${string}`) => {
  const { data } = useReadContract({
    ...mockIdrxConfig,
    functionName: 'allowance',
    args: [owner, spender],
  });
  
  return data ? formatEther(data as bigint) : '0';
};

export const useIdrxTotalSupply = () => {
  const { data } = useReadContract({
    ...mockIdrxConfig,
    functionName: 'totalSupply',
  });
  
  return data ? formatEther(data as bigint) : '0';
};

export const useMintIdrx = () => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address } = useAccount();
  
  const mint = async (toAddress: `0x${string}`, amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    const amountWei = parseEther(amount);
    
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
    
    const amountWei = parseEther(amount);
    
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
    
    const amountWei = parseEther(amount);
    
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