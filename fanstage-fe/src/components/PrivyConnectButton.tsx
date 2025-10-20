import { useConnectWallet, useLogout, usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { privyApiClient } from '../services/privyAuth';
import { UserProfile } from '../types';

export function PrivyConnectButton() {
  const { connectWallet } = useConnectWallet();
  const { logout } = useLogout();
  const { authenticated, user, getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  // Check if user profile is incomplete (first-time user)
  const isFirstTimeUser = (profile: UserProfile | null) => {
    if (!profile) return true;
    
    // Check if essential profile fields are missing
    const hasUsername = !!profile.username;
    const hasEmail = !!profile.email;
    const hasBio = !!profile.bio;
    const hasSocialMedia = !!profile.socialMediaLinks;
    
    // Consider it a first-time user if most fields are empty
    const filledFields = [hasUsername, hasEmail, hasBio, hasSocialMedia].filter(Boolean).length;
    return filledFields < 2; // Less than 2 fields filled means incomplete profile
  };

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const profile = await privyApiClient.getUserProfile();
      setUserProfile(profile);
      return profile;
    } catch (error) {
      return null;
    }
  };

  // Fetch profile when user becomes authenticated and redirect if first-time user
  useEffect(() => {
    if (authenticated && user && !userProfile) {
      const loadProfileAndRedirect = async () => {
        const profile = await fetchUserProfile();
        if (profile && isFirstTimeUser(profile)) {
          // Redirect first-time users to profile page
          navigate('/profile');
        }
      };
      loadProfileAndRedirect();
    }
  }, [authenticated, user, userProfile, navigate]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Connect wallet using Privy
      await connectWallet();
      
      if (authenticated) {
        // Get Privy access token
        const accessToken = await getAccessToken();
        
        // Store token for API calls (optional, as we use getAccessToken() directly)
        localStorage.setItem('privyAccessToken', accessToken);
        
        // Fetch user profile after connection
        const profile = await fetchUserProfile();
        
        // Only redirect to profile page if it's a first-time user with incomplete profile
        if (profile && isFirstTimeUser(profile)) {
          navigate('/profile');
        } else {
          // Redirect existing users to dashboard
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Logout from Privy
      await logout();
      
      // Clear stored token
      localStorage.removeItem('privyAccessToken');
      
      // Clear user profile
      setUserProfile(null);
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLinkWallet = async () => {
    try {
      if (!user?.wallet?.address) {
        return;
      }

      await privyApiClient.linkWallet(user.wallet.address);
      await fetchUserProfile(); // Refresh profile
      alert('Wallet linked successfully!');
    } catch (error) {
      alert('Failed to link wallet');
    }
  };

  if (authenticated && userProfile) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="font-medium">{userProfile.username}</div>
          <div className="text-gray-500">
            {userProfile.role === 'artist' ? '🎨 Artist' : '👤 Fan'}
          </div>
          {userProfile.walletAddress.startsWith('temp_') && (
            <div className="text-orange-500 text-xs">
              ⚠️ Temporary wallet - please link real wallet
            </div>
          )}
        </div>
        
        {userProfile.walletAddress.startsWith('temp_') && (
          <button
            onClick={handleLinkWallet}
            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
          >
            Link Wallet
          </button>
        )}
        
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
