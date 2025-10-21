import type { AxiosResponse } from 'axios';
import { apiClient } from './privyAuth';

export interface ArtistMetadata {
  name: string;
  description: string;
  image: string;
  artistCategory: 'rising_star' | 'senior_star';
  external_url?: string;
  socialMediaLinks?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  createdAt: string;
}

type IpfsUploadResponse = {
  cid: string;
  ipfs_url?: string;
  url?: string;
};

const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

const resolveIpfsUri = (response: AxiosResponse<IpfsUploadResponse>): string => {
  if (response.data.ipfs_url) {
    return response.data.ipfs_url;
  }
  if (response.data.cid) {
    return `ipfs://${response.data.cid}`;
  }
  throw new Error('IPFS response missing CID');
};

const resolveGatewayUrl = (response: AxiosResponse<IpfsUploadResponse>): string => {
  if (response.data.url) {
    return response.data.url;
  }
  if (response.data.cid) {
    return `${DEFAULT_IPFS_GATEWAY}${response.data.cid}`;
  }
  return '';
};

export const ipfsService = {
  // Upload artist metadata to IPFS
  uploadArtistMetadata: async (metadata: ArtistMetadata): Promise<string> => {
    try {
      const response = await apiClient.post<IpfsUploadResponse>(
        '/ipfs/upload-json',
        metadata
      );

      return resolveIpfsUri(response);
    } catch (error) {
      console.error('Failed to upload artist metadata to IPFS:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  },

  // Upload file to IPFS
  uploadFile: async (
    file: File
  ): Promise<{ ipfsUri: string; gatewayUrl: string; cid: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<IpfsUploadResponse>(
        '/ipfs/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const ipfsUri = resolveIpfsUri(response);
      const gatewayUrl = resolveGatewayUrl(response);

      return {
        ipfsUri,
        gatewayUrl,
        cid: response.data.cid,
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  },

  // Get file from IPFS
  getFile: async (ipfsHash: string): Promise<unknown> => {
    try {
      const cid = ipfsHash.replace('ipfs://', '');
      const response = await apiClient.get(`/ipfs/file/${cid}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get file from IPFS:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  },

  // Check IPFS service health
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/ipfs/health');
      return response.data.status === 'healthy' || response.data.status === 'ok';
    } catch (error) {
      console.error('IPFS service health check failed:', error);
      return false;
    }
  },
};

export default ipfsService;
