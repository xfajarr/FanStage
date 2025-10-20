import { ReactNode, useEffect } from 'react';
import { usePrivy, getAccessToken } from '@privy-io/react-auth';
import { privyApiClient } from '../services/privyAuth';

interface PrivyContextProviderProps {
  children: ReactNode;
}

export function PrivyContextProvider({ children }: PrivyContextProviderProps) {
  const { authenticated, user, ready } = usePrivy();

  useEffect(() => {
    // Initialize API client when user is authenticated
    if (authenticated && user) {
      // API client is automatically initialized when user is authenticated
    }
  }, [authenticated, user]);

  return <>{children}</>;
}