import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { privyApiClient } from '@/services/privyAuth';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

const INITIAL_FORM_STATE = {
  username: '',
  email: '',
  bio: '',
  twitter: '',
  instagram: '',
};

const SOCIAL_MATCHERS = {
  twitter: /twitter\.com\/@?([^\s\n]+)/i,
  instagram: /instagram\.com\/([^\s\n]+)/i,
};

type FormState = typeof INITIAL_FORM_STATE;

const parseSocialLinks = (links: string | null) => {
  const twitterMatch = links?.match(SOCIAL_MATCHERS.twitter);
  const instagramMatch = links?.match(SOCIAL_MATCHERS.instagram);

  return {
    twitterHandle: twitterMatch ? twitterMatch[1] : '',
    instagramHandle: instagramMatch ? instagramMatch[1] : '',
    hasTwitter: Boolean(twitterMatch),
    hasInstagram: Boolean(instagramMatch),
  };
};

export const useProfilePage = () => {
  const { authenticated, user } = usePrivy();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyingTwitter, setVerifyingTwitter] = useState(false);
  const [verifyingInstagram, setVerifyingInstagram] = useState(false);
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [instagramVerified, setInstagramVerified] = useState(false);

  const applyProfileToState = useCallback((profile: UserProfile) => {
    const socialLinks = parseSocialLinks(profile.socialMediaLinks || '');

    setFormState({
      username: profile.username || '',
      email: profile.email || '',
      bio: profile.bio || '',
      twitter: socialLinks.twitterHandle,
      instagram: socialLinks.instagramHandle,
    });

    setTwitterVerified(socialLinks.hasTwitter);
    setInstagramVerified(socialLinks.hasInstagram);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await privyApiClient.getUserProfile();
      setUserProfile(profile);
      applyProfileToState(profile);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [applyProfileToState, toast]);

  useEffect(() => {
    if (authenticated) {
      fetchUserProfile();
    } else {
      navigate('/');
    }
  }, [authenticated, fetchUserProfile, navigate]);

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (userProfile) {
      applyProfileToState(userProfile);
    }
    setIsEditing(false);
  }, [applyProfileToState, userProfile]);

  const startEditing = useCallback(() => {
    if (userProfile) {
      setIsEditing(true);
    }
  }, [userProfile]);

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true);

      if (
        formState.email &&
        !formState.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address.',
          variant: 'destructive',
        });
        return;
      }

      let socialMediaLinks = '';
      if (formState.twitter) {
        socialMediaLinks += `https://twitter.com/@${formState.twitter.replace('@', '')}\n`;
      }
      if (formState.instagram) {
        socialMediaLinks += `https://instagram.com/${formState.instagram}\n`;
      }

      const updatedProfile = await privyApiClient.updateProfile({
        username: formState.username || null,
        email: formState.email || null,
        bio: formState.bio || null,
        socialMediaLinks: socialMediaLinks.trim() || null,
      });

      setUserProfile(updatedProfile);
      applyProfileToState(updatedProfile);
      setIsEditing(false);

      toast({
        title: 'Success!',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error) ||
            'Failed to update profile. Please try again.'
          : 'Failed to update profile. Please try again.';

      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [applyProfileToState, formState, toast]);

  const handleVerifyTwitter = useCallback(async () => {
    setVerifyingTwitter(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setTwitterVerified(true);
      toast({
        title: 'Twitter Verified!',
        description: 'Your Twitter account has been successfully verified.',
      });
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Could not verify your Twitter account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingTwitter(false);
    }
  }, [toast]);

  const handleVerifyInstagram = useCallback(async () => {
    setVerifyingInstagram(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setInstagramVerified(true);
      toast({
        title: 'Instagram Verified!',
        description: 'Your Instagram account has been successfully verified.',
      });
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Could not verify your Instagram account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingInstagram(false);
    }
  }, [toast]);

  const formatWalletAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const goToRegisterArtist = useCallback(() => {
    navigate('/register-artist');
  }, [navigate]);

  const canEdit = useMemo(() => Boolean(userProfile), [userProfile]);

  return {
    isAuthenticated: Boolean(authenticated),
    user,
    userProfile,
    formState,
    isLoading,
    isEditing,
    isSaving,
    verifyingTwitter,
    verifyingInstagram,
    twitterVerified,
    instagramVerified,
    canEdit,
    startEditing,
    handleInputChange,
    handleSaveProfile,
    handleCancelEdit,
    handleVerifyTwitter,
    handleVerifyInstagram,
    fetchUserProfile,
    formatWalletAddress,
    goHome,
    goToDashboard,
    goToRegisterArtist,
  };
};

export type UseProfilePageReturn = ReturnType<typeof useProfilePage>;
