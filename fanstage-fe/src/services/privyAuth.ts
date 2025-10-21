import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '@privy-io/react-auth';
import { UserProfile, ArtistCategory } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

// Create axios instance for API calls
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return client;
};
// Create singleton instance
export const apiClient = createApiClient();

// User profile type is now imported from ../types

// API response wrapper
export interface ApiResponse<T> {
  user: T;
}

// Privy API client methods
export const privyApiClient = {
  // Get current user profile
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users-privy/profile');
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/users-privy/profile', data);
    return response.data.user;
  },

  // Register as artist
  registerAsArtist: async (data: {
    artistCategory: ArtistCategory;
    bio?: string;
    socialMediaLinks?: string;
    profileImageUrl?: string;
  }): Promise<UserProfile> => {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/users-privy/register-artist', data);
    return response.data.user;
  },

  // Link wallet address
  linkWallet: async (walletAddress: string): Promise<UserProfile> => {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/users-privy/link-wallet', {
      walletAddress,
    });
    return response.data.user;
  },

  // Get auth status (for testing connection)
  getAuthStatus: async () => {
    try {
      const response = await apiClient.get('/users-privy/profile');
      return { status: 'authenticated', data: response.data };
    } catch (error) {
      return { status: 'error', error };
    }
  },
};

export default privyApiClient;
