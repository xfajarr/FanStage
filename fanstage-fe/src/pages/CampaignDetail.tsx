import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import {
  ArrowLeft,
  Loader2,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import InvestmentModal from '@/components/campaigns/InvestmentModal';
import SubmitRevenueModal from '@/components/campaigns/SubmitRevenueModal';
import ClaimRevenueModal from '@/components/campaigns/ClaimRevenueModal';
import campaignsApi from '@/services/campaigns';
import { formatIDRX } from '@/utils/currency';
import { useCampaignData, useCampaignFundersCount, CampaignStatus, useClaimableRevenue, useTotalFunded } from '@/services/contracts';

const fetchMetadata = async (ipfsHash: string) => {
  const cid = ipfsHash.replace('ipfs://', '');
  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) {
    throw new Error('Failed to load campaign metadata');
  }
  return response.json() as Promise<{
    story?: string;
    coverImageUrl?: string;
  }>;
};

export default function CampaignDetail() {
  const { id } = useParams();
  const { address } = useAccount();
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isSubmitRevenueModalOpen, setIsSubmitRevenueModalOpen] = useState(false);
  const [isClaimRevenueModalOpen, setIsClaimRevenueModalOpen] = useState(false);

  const {
    data: campaign,
    status,
    refetch: refetchCampaign,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getCampaignById(id ?? ''),
    enabled: Boolean(id),
  });

  // Get real-time data from contract
  const { data: contractData } = useCampaignData(
    (campaign?.campaignContract || '0x') as `0x${string}`
  );

  // Get real-time funders count from contract
  const { data: fundersCount } = useCampaignFundersCount(
    (campaign?.campaignContract || '0x') as `0x${string}`
  );

  // Get claimable revenue for current user
  const claimableRevenue = useClaimableRevenue(
    (campaign?.campaignContract || '0x') as `0x${string}`,
    (address || '0x') as `0x${string}`
  );

  // Get total funded by current user
  const totalFunded = useTotalFunded(
    (campaign?.campaignContract || '0x') as `0x${string}`,
    (address || '0x') as `0x${string}`
  );

  const {
    data: metadata,
    status: metadataStatus,
  } = useQuery({
    queryKey: ['campaign', id, 'metadata'],
    queryFn: () => fetchMetadata(campaign?.ipfsHash ?? ''),
    enabled: Boolean(campaign?.ipfsHash),
  });

  const fundingStats = useMemo(() => {
    if (!campaign) {
      return { raised: 0, goal: 0, progress: 0 };
    }

    // Use real-time contract data if available
    const raised = contractData
      ? Number(contractData.totalRaised) / 1e2 // Convert from wei to IDRX
      : Number(campaign.currentFunding) || 0;

    const goal = contractData
      ? Number(contractData.targetAmount) / 1e2
      : Number(campaign.fundingGoal) || 0;

    const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
    return { raised, goal, progress };
  }, [campaign, contractData]);

  const daysRemaining = useMemo(() => {
    if (!campaign) return 0;
    const end = new Date(campaign.endDate).getTime();
    const now = Date.now();
    if (Number.isNaN(end)) return 0;
    return Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
  }, [campaign]);

  // Check if campaign is fully funded based on contract status
  const isCampaignFunded = contractData?.status === CampaignStatus.FUNDED ||
                           contractData?.status === CampaignStatus.COMPLETED;

  // Check if current user is the artist
  const isArtist = useMemo(() => {
    if (!address || !contractData?.artist) return false;
    return address.toLowerCase() === contractData.artist.toLowerCase();
  }, [address, contractData?.artist]);

  // Check if current user is a backer with claimable revenue
  const isBacker = useMemo(() => {
    if (!address) return false;
    return parseFloat(claimableRevenue) > 0;
  }, [address, claimableRevenue]);

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 mb-3 animate-spin" />
          Loading campaign...
        </div>
      </div>
    );
  }

  if (status === 'error' || !campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <Link to="/campaigns">
            <Button variant="outline">Back to Campaigns</Button>
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = metadata?.coverImageUrl ?? campaign.coverImage ?? '';
  const story = metadata?.story;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Link to="/campaigns">
          <Button variant="ghost" className="rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {coverImage ? (
              <div className="relative h-80 rounded-2xl overflow-hidden">
                <img
                  src={coverImage}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <Badge className="absolute top-4 right-4 capitalize bg-primary text-primary-foreground">
                  {campaign.category.replace('-', ' ')}
                </Badge>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Created by <span className="font-semibold">{campaign.artistName ?? 'Unknown Artist'}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{campaign.title}</h1>
              <p className="text-muted-foreground">{campaign.description}</p>
            </div>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Campaign Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p className="font-medium">
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date</span>
                  <p className="font-medium">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Supporter Share</span>
                  <p className="font-medium">{campaign.profitShare.fan}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Artist Share</span>
                  <p className="font-medium">{campaign.profitShare.artist}%</p>
                </div>
              </div>

              {metadataStatus === 'pending' ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading on-chain metadata...
                </div>
              ) : null}

              {story ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Story</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {story}
                  </p>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-24">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold text-primary">
                      {formatIDRX(fundingStats.raised)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatIDRX(fundingStats.goal)}
                    </span>
                  </div>
                  <Progress value={fundingStats.progress} className="h-3 my-3" />
                  {isCampaignFunded ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>100% funded - Goal Reached!</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {fundingStats.progress.toFixed(1)}% funded
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Backers
                    </div>
                    <p className="text-2xl font-bold">
                      {fundersCount ? Number(fundersCount) : campaign.backerCount}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Days Left
                    </div>
                    <p className="text-2xl font-bold">{daysRemaining}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 rounded-lg bg-accent">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    Supporters receive <strong>{campaign.profitShare.fan}%</strong> of future revenue.
                  </div>
                </div>

                {campaign.status === 'Ended' ? (
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full rounded-lg"
                      disabled
                      variant="secondary"
                    >
                      Campaign Ended
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      This campaign has reached its deadline and is no longer accepting investments.
                    </p>
                  </div>
                ) : contractData?.status === CampaignStatus.FUNDED && isArtist ? (
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full rounded-lg gradient-primary text-primary-foreground"
                      onClick={() => setIsSubmitRevenueModalOpen(true)}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Distribute Funds
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Distribute raised funds to you and your backers.
                    </p>
                  </div>
                ) : contractData?.status === CampaignStatus.COMPLETED && isBacker ? (
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full rounded-lg gradient-primary text-primary-foreground"
                      onClick={() => setIsClaimRevenueModalOpen(true)}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Claim Your Share
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      You have {formatIDRX(parseFloat(claimableRevenue))} ready to claim!
                    </p>
                  </div>
                ) : contractData?.status === CampaignStatus.COMPLETED ? (
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      disabled
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Funds Distributed
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Funds have been distributed. Backers can claim their shares.
                    </p>
                  </div>
                ) : isCampaignFunded ? (
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full rounded-lg bg-green-600 hover:bg-green-700 text-white"
                      disabled
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fully Funded
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      {isArtist
                        ? "Campaign fully funded! Distribute funds to unlock profits."
                        : "This campaign has reached its funding goal and is no longer accepting investments."}
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full rounded-lg gradient-primary text-primary-foreground mt-4"
                    onClick={() => setIsInvestModalOpen(true)}
                  >
                    Invest Now
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        <InvestmentModal
          open={isInvestModalOpen}
          onOpenChange={setIsInvestModalOpen}
          campaignContract={campaign.campaignContract || ''}
          campaignTitle={campaign.title}
          targetAmount={fundingStats.goal.toString()}
          currentFunding={fundingStats.raised.toString()}
          campaignStatus={campaign.status}
          campaignEndDate={campaign.endDate}
          onInvestmentSuccess={() => {
            refetchCampaign();
          }}
        />

        <SubmitRevenueModal
          open={isSubmitRevenueModalOpen}
          onOpenChange={setIsSubmitRevenueModalOpen}
          campaignContract={campaign.campaignContract || ''}
          campaignTitle={campaign.title}
          funderSharePercent={campaign.profitShare.fan}
          totalRaised={fundingStats.raised}
          fundersCount={fundersCount ? Number(fundersCount) : campaign.backerCount}
          onRevenueSubmitted={() => {
            refetchCampaign();
          }}
        />

        <ClaimRevenueModal
          open={isClaimRevenueModalOpen}
          onOpenChange={setIsClaimRevenueModalOpen}
          campaignContract={campaign.campaignContract || ''}
          campaignTitle={campaign.title}
          claimableAmount={parseFloat(claimableRevenue)}
          investedAmount={parseFloat(totalFunded)}
          onRevenueClaimed={() => {
            refetchCampaign();
          }}
        />
      </div>
    </div>
  );
}
