import { useMemo } from 'react';
import { useAllArtists } from '@/services/contracts';

export interface ArtistListItem {
  address: `0x${string}`;
  name: string;
  createdAt: number;
}

export const useAllArtistsList = () => {
  const { data, status, error } = useAllArtists();

  const artists = useMemo<ArtistListItem[]>(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const [addresses, profiles] = data as unknown as [
      readonly `0x${string}`[],
      readonly { name: string; createdAt: bigint }[]
    ];

    if (!Array.isArray(addresses) || !Array.isArray(profiles)) {
      return [];
    }

    return addresses.map((address, index) => {
      const profile = profiles[index];
      const createdAtSeconds =
        profile && typeof profile.createdAt === 'bigint'
          ? Number(profile.createdAt)
          : 0;

      return {
        address,
        name: profile?.name ?? 'Unknown Artist',
        createdAt: createdAtSeconds ? createdAtSeconds * 1000 : 0,
      };
    });
  }, [data]);

  return {
    artists,
    status,
    error,
  };
};

export default useAllArtistsList;
