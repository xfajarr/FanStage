import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, Trophy, Wallet, Zap, Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { privyApiClient } from '@/services/privyAuth';
import dashboardApi, { type ArtistDashboardData, type FanDashboardData } from '@/services/dashboard';
import { graphqlQuery, TOKEN_QUERIES, CAMPAIGN_QUERIES, FAN_QUERIES, ARTIST_QUERIES, type GetFanTokenHoldingsResponse, type GetAllCampaignsResponse, type GetFanActivityResponse, type GetAllArtistsResponse } from '@/services/graphql';
import { formatUnits } from 'viem';
import type { UserProfile } from '@/types';

interface ArtistDashboardProps {
  userProfile: UserProfile;
  dashboardData: ArtistDashboardData | null;
}

interface FanDashboardProps {
  userProfile: UserProfile;
  dashboardData: FanDashboardData | null;
}

interface EnrichedArtistToken {
  id: string;
  artistToken: string;
  tokenName: string;
  tokenSymbol: string;
  balance: string;
  campaignTitle: string;
  campaignId: string;
  artistName: string;
  investmentDate: string;
  status: string;
}

function ArtistDashboard({ userProfile, dashboardData }: ArtistDashboardProps) {
  const stats = dashboardData?.stats || {
    totalCampaigns: 0,
    totalFundsRaised: 0,
    completedCampaigns: 0,
    totalInvestors: 0,
  };

  const campaigns = dashboardData?.campaigns || [];
  const revenue = dashboardData?.revenue || {
    totalRevenue: 0,
    pendingRevenue: 0,
    distributedRevenue: 0,
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Artist Dashboard</h1>
          <p className="text-muted-foreground">Manage your campaigns and track your success</p>
        </div>
        <Link to="/create-campaign" className="inline-flex">
          <Button className="rounded-lg gradient-primary text-primary-foreground">
            + Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalCampaigns}</div>
          <div className="text-sm text-muted-foreground">Total Campaigns</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalFundsRaised.toLocaleString()} IDRX</div>
          <div className="text-sm text-muted-foreground">Funds Raised</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="text-xs">{stats.completedCampaigns}/{stats.totalCampaigns}</Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.completedCampaigns}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalInvestors}</div>
          <div className="text-sm text-muted-foreground">Total Investors</div>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Your Campaigns</h3>
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaigns yet. Create your first campaign to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{campaign.title}</h4>
                    <Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Goal</div>
                      <div className="font-bold">{Number(campaign.fundingGoal).toLocaleString()} IDRX</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Raised</div>
                      <div className="font-bold text-primary">{Number(campaign.currentFunding).toLocaleString()} IDRX</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Backers</div>
                      <div className="font-bold">{campaign.backerCount}</div>
                    </div>
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function FanDashboard({ userProfile, dashboardData }: FanDashboardProps) {
  const stats = dashboardData?.stats || {
    totalInvested: 0,
    totalEarned: 0,
    totalTokensHeld: 0,
    totalTokenValue: 0,
  };

  const investments = dashboardData?.investments || [];
  const nfts = dashboardData?.nfts || [];

  // Fetch artist token holdings from indexer
  const {
    data: tokenHoldingsData,
    isLoading: isLoadingTokens,
    error: tokenError,
  } = useQuery({
    queryKey: ['fan-token-holdings', userProfile.walletAddress],
    queryFn: async (): Promise<EnrichedArtistToken[]> => {
      if (!userProfile.walletAddress) return [];

      try {
        // Get token transfer events for this user
        const tokenTransfers = await graphqlQuery<GetFanTokenHoldingsResponse>(
          TOKEN_QUERIES.GET_FAN_TOKEN_HOLDINGS,
          { fanAddress: userProfile.walletAddress.toLowerCase() }
        );

        // Get all campaigns to map token data to campaigns
        const campaignsData = await graphqlQuery<GetAllCampaignsResponse>(
          CAMPAIGN_QUERIES.GET_ALL_CAMPAIGNS
        );

        // Get all artists to map wallet addresses to names
        const artistsData = await graphqlQuery<GetAllArtistsResponse>(
          ARTIST_QUERIES.GET_ALL_ARTISTS
        );

        // Create artist lookup map: wallet address → artist name
        const artistLookup = new Map<string, string>();
        artistsData.ArtistIdentity_ArtistRegistered.forEach((artist) => {
          artistLookup.set(artist.artist.toLowerCase(), artist.name);
        });

        const tokenBalances = new Map<string, { balance: bigint; firstTransfer: any }>();
        
        // Calculate net balance for each artist token
        tokenTransfers.ArtistToken_Transfer.forEach((transfer) => {
          const current = tokenBalances.get(transfer.artistToken) || { balance: 0n, firstTransfer: transfer };
          
          if (transfer.from === '0x0000000000000000000000000000000000000000') {
            // Minting (receiving tokens)
            current.balance += BigInt(transfer.value);
          } else {
            // Burning/transferring out
            current.balance -= BigInt(transfer.value);
          }
          
          tokenBalances.set(transfer.artistToken, current);
        });

        // Build enriched token list
        const enrichedTokens: EnrichedArtistToken[] = [];
        
        for (const [artistToken, { balance, firstTransfer }] of tokenBalances.entries()) {
          if (balance <= 0n) continue; // Only show tokens with positive balance
          
          // Find matching campaign
          const campaign = campaignsData.CampaignRegistry_CampaignCreated.find(
            (c) => c.campaignContract.toLowerCase() === firstTransfer.campaignContract?.toLowerCase()
          );
          
          // Get artist name from lookup, fallback to wallet address if not found
          const artistWallet = campaign?.artist?.toLowerCase();
          const artistName = artistWallet ? 
            (artistLookup.get(artistWallet) || `${artistWallet.slice(0, 6)}...${artistWallet.slice(-4)}`) : 
            'Unknown Artist';
          
          enrichedTokens.push({
            id: `${artistToken}-${userProfile.walletAddress}`,
            artistToken,
            tokenName: firstTransfer.tokenName || 'Unknown Token',
            tokenSymbol: firstTransfer.tokenSymbol || 'UNKNOWN',
            balance: formatUnits(balance, 2),
            campaignTitle: campaign?.title || 'Unknown Campaign',
            campaignId: campaign?.campaignId.toString() || '0',
            artistName: artistName,
            investmentDate: new Date(Number(firstTransfer.blockTimestamp) * 1000).toISOString(),
            status: campaign?.status || 'Unknown',
          });
        }

        return enrichedTokens.sort(
          (a, b) => new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime()
        );
      } catch (error) {
        console.error('Error fetching artist token holdings:', error);
        return [];
      }
    },
    enabled: !!userProfile.walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const artistTokens = tokenHoldingsData || [];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Track your investments and rewards</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalInvested.toLocaleString()} IDRX</div>
          <div className="text-sm text-muted-foreground">Total Invested</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalEarned.toLocaleString()} IDRX</div>
          <div className="text-sm text-muted-foreground">Profit Earned</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <Badge variant="outline" className="text-xs">Tokens</Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalTokensHeld.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Artist Tokens</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Trophy className="h-5 w-5 text-purple-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalTokenValue.toLocaleString()} IDRX</div>
          <div className="text-sm text-muted-foreground">Token Value</div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="investments" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="tokens">Artist Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFT Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="investments">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Your Investments</h3>
            {investments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No investments yet. Start investing in your favorite artists!</p>
                <Link to="/campaigns" className="inline-flex mt-4">
                  <Button className="rounded-lg">Browse Campaigns</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {investments.map((investment) => (
                  <div key={investment.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{investment.campaignTitle}</h4>
                        <p className="text-sm text-muted-foreground">by {investment.artistName}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Invested</div>
                          <div className="font-bold">{investment.amount.toLocaleString()} IDRX</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Profit Share</div>
                          <div className="font-bold text-primary">{investment.profitShare}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Earned</div>
                          <div className="font-bold text-green-600">
                            {investment.earnedProfit?.toLocaleString() || '0.00'} IDRX
                          </div>
                        </div>
                        <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                          {investment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Artist Token Holdings</h3>
            
            {isLoadingTokens ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading artist tokens...
              </div>
            ) : tokenError ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-destructive mb-2">Failed to load artist tokens</p>
                <p className="text-sm">Please check your connection and try again</p>
              </div>
            ) : artistTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No artist tokens yet. Invest in campaigns to receive artist tokens!</p>
                <Link to="/campaigns" className="inline-flex mt-4">
                  <Button className="rounded-lg">Browse Campaigns</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {artistTokens.map((token) => (
                  <div key={token.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">
                          {token.tokenName} ({token.tokenSymbol})
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          From {token.campaignTitle} • {new Date(token.investmentDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contract: {token.artistToken.slice(0, 10)}...{token.artistToken.slice(-8)}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Balance</div>
                          <div className="font-bold">
                            {Number(token.balance).toLocaleString()} {token.tokenSymbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Artist</div>
                          <div className="font-bold text-primary">
                            {token.artistName}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Campaign</div>
                          <Badge variant={token.status === 'Active' ? 'default' : 'secondary'}>
                            {token.status}
                          </Badge>
                        </div>
                        <Link to={`/campaigns/${token.campaignId}`}>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            View Campaign
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="nfts">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">NFT Collection</h3>
            {nfts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No NFTs yet. Invest in campaigns to earn exclusive NFTs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <div key={nft.id} className="border rounded-lg overflow-hidden hover-lift">
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-badge.png';
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="text-xs font-medium">
                          {nft.tier || 'Badge'}
                        </Badge>
                      </div>
                      <Badge className="absolute top-4 right-4 capitalize">
                        {nft.type.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold mb-1">{nft.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{nft.artistName}</p>
                      {nft.benefits && nft.benefits.length > 0 && (
                        <div className="space-y-1">
                          {nft.benefits.slice(0, 2).map((benefit, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              • {benefit}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function Dashboard() {
  const { authenticated } = usePrivy();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authenticated) {
      setUserProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const profile = await privyApiClient.getUserProfile();
        if (!cancelled) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to load dashboard profile:', error);
        if (!cancelled) {
          setUserProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  // Fetch dashboard data based on user role
  const {
    data: dashboardData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dashboard', userProfile?.role, userProfile?.walletAddress],
    queryFn: async () => {
      if (!userProfile?.walletAddress) return null;
      
      if (userProfile.role === 'artist') {
        return dashboardApi.getArtistDashboard(userProfile.walletAddress);
      } else {
        return dashboardApi.getFanDashboard(userProfile.walletAddress);
      }
    },
    enabled: !!userProfile?.walletAddress,
  });

  if (!authenticated || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Please connect your wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16 text-destructive">
            <p className="text-lg font-medium">Failed to load dashboard.</p>
            <p className="text-sm">Please refresh the page or try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        {userProfile.role === 'artist' ? (
          <ArtistDashboard 
            userProfile={userProfile} 
            dashboardData={dashboardData as ArtistDashboardData} 
          />
        ) : (
          <FanDashboard 
            userProfile={userProfile} 
            dashboardData={dashboardData as FanDashboardData} 
          />
        )}
      </div>
    </div>
  );
}
