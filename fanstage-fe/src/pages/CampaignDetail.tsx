import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import campaignsApi from '@/services/campaigns';

const formatCurrency = (value: string) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return `${numeric.toLocaleString()} IDRX`;
};

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

  const {
    data: campaign,
    status,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getCampaignById(id ?? ''),
    enabled: Boolean(id),
  });

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
    const raised = Number(campaign.currentFunding) || 0;
    const goal = Number(campaign.fundingGoal) || 0;
    const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
    return { raised, goal, progress };
  }, [campaign]);

  const daysRemaining = useMemo(() => {
    if (!campaign) return 0;
    const end = new Date(campaign.endDate).getTime();
    const now = Date.now();
    if (Number.isNaN(end)) return 0;
    return Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
  }, [campaign]);

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
                      {formatCurrency(campaign.currentFunding)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatCurrency(campaign.fundingGoal)}
                    </span>
                  </div>
                  <Progress value={fundingStats.progress} className="h-3 my-3" />
                  <p className="text-sm text-muted-foreground">
                    {fundingStats.progress.toFixed(1)}% funded
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Backers
                    </div>
                    <p className="text-2xl font-bold">{campaign.backerCount}</p>
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

                <Link to={`/campaigns/${campaign.id}?invest=true`}>
                  <Button className="w-full rounded-lg gradient-primary text-primary-foreground">
                    Invest Now
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
