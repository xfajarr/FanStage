import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';
import { privyApiClient } from '@/services/privyAuth';
import { ipfsService, type ArtistMetadata } from '@/services/ipfs';
import { useRegisterArtist, useTransactionReceipt } from '@/services/contracts';
import type { UserProfile } from '@/types';

type ArtistFormData = {
  artistName: string;
  bio: string;
  tier: 'rising-star' | 'senior-star';
  twitter: string;
  instagram: string;
  spotify: string;
  portfolio: string;
};

const INITIAL_FORM_DATA: ArtistFormData = {
  artistName: '',
  bio: '',
  tier: 'rising-star',
  twitter: '',
  instagram: '',
  spotify: '',
  portfolio: '',
};

const TARGET_NETWORK_NAME = 'Base Sepolia';

export const useArtistRegistration = () => {
  const navigate = useNavigate();
  const { authenticated } = usePrivy();
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ArtistFormData>(INITIAL_FORM_DATA);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageGatewayUrl, setProfileImageGatewayUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const { registerArtist, hash, error, isPending } = useRegisterArtist();
  const { data: receipt, isLoading: isConfirming } = useTransactionReceipt(hash);

  const showNetworkWarning = chainId !== baseSepolia.id;

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const profile = await privyApiClient.getUserProfile();
      setUserProfile(profile);

      if (profile.role === 'artist') {
        toast.info('You are already registered as an artist!');
        navigate('/dashboard');
        return;
      }
    } catch (err) {
      console.error('Failed to load user profile for artist registration:', err);
      toast.error('Failed to load user profile');
      navigate('/');
    } finally {
      setIsProfileLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authenticated) {
      navigate('/');
      return;
    }

    fetchUserProfile();
  }, [authenticated, fetchUserProfile, navigate]);

  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
      toast.info('Transaction submitted! Waiting for confirmation...');
    }
  }, [hash]);

  const buildSocialMediaLinks = useCallback((): string => {
    const links: string[] = [];

    if (formData.twitter) {
      const twitterHandle = formData.twitter.replace('@', '');
      links.push(`https://twitter.com/@${twitterHandle}`);
    }

    if (formData.instagram) {
      links.push(`https://instagram.com/${formData.instagram.replace('@', '')}`);
    }

    if (formData.spotify) {
      links.push(`https://spotify.com/artist/${formData.spotify}`);
    }

    if (formData.portfolio) {
      links.push(formData.portfolio);
    }

    return links.join('\n');
  }, [formData]);

  const validateStep = useCallback(
    (currentStep: number): boolean => {
      switch (currentStep) {
        case 1:
          if (!formData.artistName.trim()) {
            toast.error('Artist name is required');
            return false;
          }
          if (!formData.bio.trim()) {
            toast.error('Bio is required');
            return false;
          }
          if (formData.bio.length < 50) {
            toast.error('Bio must be at least 50 characters');
            return false;
          }
          return true;
        case 2:
          if (formData.portfolio && !isValidUrl(formData.portfolio)) {
            toast.error('Please enter a valid portfolio URL');
            return false;
          }
          return true;
        case 3:
          if (!profileImageFile) {
            toast.error('Please upload a profile image for your artist identity NFT');
            return false;
          }
          return true;
        default:
          return true;
      }
    },
    [formData, profileImageFile],
  );

  const updateBackendAfterRegistration = useCallback(async () => {
    try {
      await privyApiClient.registerAsArtist({
        artistCategory: formData.tier === 'rising-star' ? 'rising_star' : 'senior_star',
        bio: formData.bio,
        socialMediaLinks: buildSocialMediaLinks() || undefined,
        profileImageUrl: profileImageGatewayUrl ?? undefined,
      });

      toast.success('Artist registration successful! Welcome to FanStage!');
      setIsSubmitting(false);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to update backend after blockchain registration:', err);
      toast.error('Blockchain registration successful, but backend update failed');
      setIsSubmitting(false);
    }
  }, [buildSocialMediaLinks, formData.bio, formData.tier, navigate, profileImageGatewayUrl]);

  useEffect(() => {
    if (!receipt) {
      return;
    }

    if (receipt.status === 'success') {
      toast.success('Artist registration confirmed on blockchain!');
      updateBackendAfterRegistration();
    } else {
      toast.error('Transaction failed on blockchain');
      setIsSubmitting(false);
    }
  }, [receipt, updateBackendAfterRegistration]);

  useEffect(() => {
    if (error) {
      toast.error(`Transaction failed: ${error.message}`);
      setIsSubmitting(false);
    }
  }, [error]);

  const updateFormField = useCallback(
    (field: keyof ArtistFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const goToPreviousStep = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleProfileImageSelection = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file (PNG, JPG, or WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile image must be smaller than 5MB');
        return;
      }

      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }

      setProfileImageFile(file);
      setProfileImageGatewayUrl(null);
      setProfileImagePreview(URL.createObjectURL(file));
    },
    [profileImagePreview],
  );

  const handleProfileImageUploadClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleRemoveProfileImage = useCallback(() => {
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(null);
    setProfileImagePreview(null);
    setProfileImageGatewayUrl(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [profileImagePreview]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateStep(step)) {
        return;
      }

      if (step < 3) {
        setStep((prev) => Math.min(prev + 1, 3));
        return;
      }

      if (chainId !== baseSepolia.id) {
        toast.error(`Please switch to ${TARGET_NETWORK_NAME} network`);
        try {
          await switchChain({ chainId: baseSepolia.id });
        } catch (err) {
          toast.error('Failed to switch network');
        }
        return;
      }

      if (!profileImageFile) {
        toast.error('Profile image missing');
        return;
      }

      setIsSubmitting(true);

      try {
        const socialLinks = buildSocialMediaLinks();
        const category = formData.tier === 'rising-star' ? 'rising_star' : 'senior_star';

        setIsUploadingToIPFS(true);

        const { ipfsUri: imageIpfsUri, gatewayUrl: gatewayUrlForImage } =
          await ipfsService.uploadFile(profileImageFile);

        setProfileImageGatewayUrl(gatewayUrlForImage || imageIpfsUri);

        const externalUrl =
          typeof window !== 'undefined' && address
            ? `${window.location.origin}/artists/${address}`
            : undefined;

        const metadata: ArtistMetadata = {
          name: formData.artistName,
          description:
            formData.bio || `FanStage artist profile for ${formData.artistName}`,
          image: imageIpfsUri,
          artistCategory: category,
          external_url: externalUrl,
          socialMediaLinks: socialLinks || undefined,
          attributes: [
            {
              trait_type: 'Category',
              value: category === 'rising_star' ? 'Rising Star' : 'Senior Star',
            },
            {
              trait_type: 'Wallet',
              value: address ?? 'Unlinked wallet',
            },
          ],
          createdAt: new Date().toISOString(),
        };

        const metadataURI = await ipfsService.uploadArtistMetadata(metadata);
        setIsUploadingToIPFS(false);

        if (!metadataURI) {
          throw new Error('Missing metadata URI from IPFS response');
        }

        toast.success('Metadata uploaded to IPFS');

        registerArtist(formData.artistName, metadataURI);
      } catch (err) {
        setIsUploadingToIPFS(false);

        let errorMessage = 'Failed to register as artist';

        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as {
            response?: { data?: { error?: string | { message?: string; name?: string } } };
          }).response?.data;

          if (response?.error) {
            if (typeof response.error === 'string') {
              errorMessage = response.error;
            } else if (response.error?.message) {
              errorMessage = response.error.message;
            } else if (response.error?.name === 'ZodError') {
              try {
                const zodErrors = JSON.parse(response.error.message);
                errorMessage = zodErrors
                  .map((zErr: { message?: string }) => zErr.message || 'Validation error')
                  .join(', ');
              } catch {
                errorMessage = 'Validation error occurred';
              }
            }
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        toast.error(errorMessage);
        setIsSubmitting(false);
      }
    },
    [
      address,
      buildSocialMediaLinks,
      chainId,
      formData.artistName,
      formData.bio,
      formData.tier,
      profileImageFile,
      registerArtist,
      step,
      switchChain,
      validateStep,
    ],
  );

  const hasProfileImage = useMemo(() => Boolean(profileImageFile), [profileImageFile]);

  return {
    step,
    formData,
    updateFormField,
    goToPreviousStep,
    handleSubmit,
    isSubmitting,
    isUploadingToIPFS,
    isPending,
    isConfirming,
    transactionHash,
    receipt,
    profileImagePreview,
    hasProfileImage,
    handleProfileImageSelection,
    handleProfileImageUploadClick,
    handleRemoveProfileImage,
    profileImageInputRef: imageInputRef,
    showNetworkWarning,
    targetNetworkName: TARGET_NETWORK_NAME,
    isProfileLoading,
    userProfile,
  };
};

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
