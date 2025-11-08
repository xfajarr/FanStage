import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';

import { privyApiClient } from '@/services/privyAuth';
import campaignsApi, { type CreateCampaignPayload } from '@/services/campaigns';
import { ipfsService } from '@/services/ipfs';
import {
  ADDRESSES,
  useCreateCampaign,
  useTransactionReceipt,
  useCampaignCreationFee,
  type Tier,
  useIdrxBalance,
  useIdrxAllowance,
  useApproveIdrx,
} from '@/services/contracts';
import type { UserProfile } from '@/types';

export type CampaignFormState = {
  title: string;
  summary: string;
  story: string;
  targetAmount: string;
  deadline: string;
  fanSharePercent: string;
  coverImageUrl: string;
  artistTokenName: string;
  campaignNftName: string;
};

export type TierFormState = {
  name: string;
  threshold: string;
  profitPercent: string;
  benefits: string;
};

const INITIAL_FORM_STATE: CampaignFormState = {
  title: '',
  summary: '',
  story: '',
  targetAmount: '',
  deadline: '',
  fanSharePercent: '30',
  coverImageUrl: '',
  artistTokenName: '',
  campaignNftName: '',
};

const INITIAL_TIER: TierFormState = {
  name: '',
  threshold: '',
  profitPercent: '',
  benefits: '',
};

export const useCreateCampaignFlow = () => {
  const navigate = useNavigate();
  const { authenticated } = usePrivy();
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [formState, setFormState] = useState<CampaignFormState>(INITIAL_FORM_STATE);
  const [tiers, setTiers] = useState<TierFormState[]>([INITIAL_TIER]);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const pendingBackendPayload = useRef<CreateCampaignPayload | null>(null);

  const { createCampaign, hash, error, isPending } = useCreateCampaign();
  const { data: receipt, isLoading: isConfirming } = useTransactionReceipt(hash);
  const { data: creationFeeRaw } = useCampaignCreationFee();
  const accountAddress = (address ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`;
  const idrxBalance = useIdrxBalance(accountAddress);
  const idrxAllowance = useIdrxAllowance(
    accountAddress,
    ADDRESSES.CampaignRegistry as `0x${string}`
  );
  const {
    approve: approveCreationFee,
    hash: approveHash,
    error: approveError,
    isPending: isApprovePending,
  } = useApproveIdrx();
  const {
    data: approveReceipt,
    isLoading: isApproveConfirming,
  } = useTransactionReceipt(approveHash);

  const fanSharePercent = useMemo(
    () => Math.min(Math.max(parseInt(formState.fanSharePercent || '0', 10), 0), 100),
    [formState.fanSharePercent]
  );
  const artistSharePercent = 100 - fanSharePercent;

  const creationFee = useMemo(() => {
    if (creationFeeRaw && typeof creationFeeRaw === 'bigint') {
      return (Number(creationFeeRaw) / 1e2).toFixed(2);
    }
    return '0';
  }, [creationFeeRaw]);
  const creationFeeValue = useMemo(() => parseFloat(creationFee || '0'), [creationFee]);
  const hasSufficientBalance = useMemo(() => {
    if (!creationFeeValue) return true;
    return parseFloat(idrxBalance) >= creationFeeValue;
  }, [creationFeeValue, idrxBalance]);
  const hasSufficientAllowance = useMemo(() => {
    if (!creationFeeValue) return true;
    return parseFloat(idrxAllowance) >= creationFeeValue;
  }, [creationFeeValue, idrxAllowance]);

  useEffect(() => {
    if (!authenticated) {
      toast.error('Please connect your wallet to continue.');
      navigate('/');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await privyApiClient.getUserProfile();
        if (profile.role !== 'artist') {
          toast.error('Only artists can create campaigns.');
          navigate('/register-artist');
          return;
        }
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load profile for campaign creation:', err);
        toast.error('Failed to verify profile. Please try again.');
        navigate('/');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [authenticated, navigate]);

  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
      toast.info('Campaign transaction submitted. Awaiting confirmation...');
    }
  }, [hash]);

  useEffect(() => {
    if (!receipt) return;

    if (receipt.status === 'success') {
      toast.success('Campaign created on-chain successfully!');
      const payload = pendingBackendPayload.current;
      if (!payload) {
        setIsSubmitting(false);
        return;
      }

      (async () => {
        try {
          await campaignsApi.createCampaign(payload);
          toast.success('Campaign saved to backend successfully!');
          pendingBackendPayload.current = null;
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } catch (apiError) {
          console.error('Failed to save campaign in backend:', apiError);
          toast.error('On-chain campaign created, but failed to save in backend.');
        } finally {
          setIsSubmitting(false);
          pendingBackendPayload.current = null;
        }
      })();
    } else {
      toast.error('Campaign transaction failed.');
      pendingBackendPayload.current = null;
      setIsSubmitting(false);
    }
  }, [navigate, receipt]);

  useEffect(() => {
    if (error) {
      console.error('Campaign creation error:', error);
      toast.error(error.message ?? 'Failed to submit campaign transaction');
      setIsSubmitting(false);
      setIsUploadingToIPFS(false);
    }
  }, [error]);

  useEffect(() => {
    if (approveError) {
      console.error('IDRX approval error:', approveError);
      toast.error(approveError.message ?? 'Failed to approve IDRX for campaign creation fee');
    }
  }, [approveError]);

  useEffect(() => {
    if (approveReceipt && approveReceipt.status === 'success') {
      toast.success('Creation fee approved successfully! You can now launch your campaign.');
    }
  }, [approveReceipt]);

  const updateFormField = useCallback(
    <K extends keyof CampaignFormState>(field: K, value: CampaignFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateTierField = useCallback(
    (index: number, field: keyof TierFormState, value: string) => {
      setTiers((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          [field]: value,
        };
        return next;
      });
    },
    []
  );

  const addTier = useCallback(() => {
    setTiers((prev) => [...prev, INITIAL_TIER]);
  }, []);

  const removeTier = useCallback((index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setTiers([INITIAL_TIER]);
    setTransactionHash(undefined);
  }, []);

  const handleApproveFee = useCallback(async () => {
    if (!address) {
      toast.error('Connect your wallet to approve the campaign creation fee.');
      return;
    }
    if (!creationFeeValue) {
      toast.info('No creation fee required.');
      return;
    }
    try {
      approveCreationFee(ADDRESSES.CampaignRegistry as `0x${string}`, creationFee);
    } catch (approveErr) {
      console.error('Failed to approve creation fee:', approveErr);
      toast.error(
        approveErr instanceof Error ? approveErr.message : 'Failed to approve creation fee.'
      );
    }
  }, [address, approveCreationFee, creationFee, creationFeeValue]);

  const validateForm = useCallback((): string | null => {
    const trimmedTitle = formState.title.trim();
    if (trimmedTitle.length < 5) {
      return 'Campaign title must be at least 5 characters long.';
    }

    if (formState.summary.trim().length < 20) {
      return 'Summary must be at least 20 characters long.';
    }

    if (!formState.targetAmount || Number(formState.targetAmount) <= 0) {
      return 'Funding goal must be greater than zero.';
    }

    if (!formState.deadline) {
      return 'Please select a deadline.';
    }

    const deadlineDate = new Date(formState.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return 'Invalid deadline value.';
    }

    const durationSeconds = Math.floor((deadlineDate.getTime() - Date.now()) / 1000);
    if (durationSeconds <= 0) {
      return 'Deadline must be in the future.';
    }
    if (durationSeconds > 365 * 24 * 60 * 60) {
      return 'Deadline cannot exceed 365 days.';
    }

    if (fanSharePercent <= 0 || fanSharePercent > 50) {
      return 'Supporter share must be between 1% and 50%.';
    }

    if (!formState.artistTokenName.trim()) {
      return 'Artist token name is required.';
    }

    if (!formState.campaignNftName.trim()) {
      return 'Campaign NFT name is required.';
    }

    if (tiers.length === 0) {
      return 'Add at least one tier.';
    }

    let previousThreshold = 0;
    let previousProfit = 0;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresholdValue = Number(tier.threshold);
      const profitValue = Number(tier.profitPercent);

      if (!tier.name.trim()) {
        return `Tier ${i + 1}: name is required.`;
      }
      if (Number.isNaN(thresholdValue) || thresholdValue <= 0) {
        return `Tier ${i + 1}: minimum investment must be greater than zero.`;
      }
      if (Number.isNaN(profitValue) || profitValue <= 0 || profitValue > 100) {
        return `Tier ${i + 1}: profit percent must be between 1 and 100.`;
      }
      if (!tier.benefits.trim()) {
        return `Tier ${i + 1}: benefits description is required.`;
      }
      if (i > 0) {
        if (thresholdValue <= previousThreshold) {
          return `Tier ${i + 1}: minimum investment must be greater than previous tiers.`;
        }
        if (profitValue < previousProfit) {
          return `Tier ${i + 1}: profit percent must be greater or equal to previous tiers.`;
        }
      }
      previousThreshold = thresholdValue;
      previousProfit = profitValue;
    }

    return null;
  }, [fanSharePercent, formState, tiers]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const validationError = validateForm();
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!address) {
        toast.error('Wallet not connected.');
        return;
      }

      if (chainId !== baseSepolia.id) {
        toast.error('Please switch to Base Sepolia network.');
        try {
          await switchChain({ chainId: baseSepolia.id });
        } catch (switchError) {
          toast.error('Failed to switch network.');
        }
        return;
      }

      try {
        setIsSubmitting(true);
        setIsUploadingToIPFS(true);

        if (!hasSufficientBalance) {
          throw new Error(
            `Insufficient IDRX balance. You need at least ${creationFee} IDRX to cover the creation fee.`
          );
        }

        if (!hasSufficientAllowance) {
          throw new Error(
            'Please approve the campaign creation fee in IDRX before launching your campaign.'
          );
        }

        const deadlineDate = new Date(formState.deadline);
        const durationSeconds = Math.floor((deadlineDate.getTime() - Date.now()) / 1000);

        const campaignTiers: Tier[] = tiers.map((tier) => ({
          name: tier.name.trim(),
          threshold: tier.threshold.trim(),
          profitPercent: Number(tier.profitPercent),
          benefits: tier.benefits.trim(),
        }));

        const metadataUri = await ipfsService.uploadCampaignMetadata({
          title: formState.title.trim(),
          summary: formState.summary.trim(),
          story: formState.story.trim() || undefined,
          coverImageUrl: formState.coverImageUrl.trim() || undefined,
          fundingGoal: formState.targetAmount.trim(),
          fanSharePercent,
          deadline: deadlineDate.toISOString(),
          artistAddress: address,
          tiers: campaignTiers,
          createdAt: new Date().toISOString(),
        });

        setIsUploadingToIPFS(false);

        pendingBackendPayload.current = {
          projectTitle: formState.title.trim(),
          shortDescription: formState.summary.trim(),
          ipfsHash: metadataUri,
          targetFundingToken: formState.targetAmount.trim(),
          profitSharePercentage: fanSharePercent,
          deadline: deadlineDate.toISOString(),
          coverImageUrl: formState.coverImageUrl.trim() || null,
        };

        await createCampaign(
          metadataUri,
          formState.targetAmount.trim(),
          durationSeconds,
          fanSharePercent,
          campaignTiers,
          formState.artistTokenName.trim(),
          formState.campaignNftName.trim()
        );
      } catch (submitError) {
        console.error('Create campaign submit error:', submitError);
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : 'Failed to create campaign. Please try again.'
        );
        pendingBackendPayload.current = null;
        setIsUploadingToIPFS(false);
        setIsSubmitting(false);
      }
    },
    [
      address,
      chainId,
      createCampaign,
      fanSharePercent,
      formState,
      switchChain,
      tiers,
      validateForm,
    ]
  );

  const isNetworkMismatched = chainId !== undefined && chainId !== baseSepolia.id;

  return {
    formState,
    tiers,
    updateFormField,
    updateTierField,
    addTier,
    removeTier,
    resetForm,
      handleSubmit,
      isUploadingToIPFS,
      isSubmitting,
      isPending,
      isConfirming,
      isApprovePending,
      isApproveConfirming,
      transactionHash,
      receipt,
      creationFee,
      fanSharePercent,
      artistSharePercent,
    isNetworkMismatched,
    userProfile,
      isProfileLoading,
      hasSufficientBalance,
      hasSufficientAllowance,
      handleApproveFee,
    };
  };

export default useCreateCampaignFlow;
