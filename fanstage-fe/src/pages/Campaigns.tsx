import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowUpRight, Users } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import campaignsApi from '@/services/campaigns';

const formatCurrency = (value: string) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }
  return numeric.toLocaleString();
};

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const artistFilter = searchParams.get('artist');

  const {
    data,
    status,
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getCampaigns(),
  });

  const campaigns = data?.campaigns ?? [];

  const categories = useMemo(() => {
    const unique = new Set<string>();
    campaigns.forEach((campaign) => {
      if (campaign.category) {
        unique.add(campaign.category);
      }
    });
    return ['all', ...Array.from(unique)];
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !searchTerm ||
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.artistName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        campaign.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesArtist =
        !artistFilter ||
        campaign.artistId.toLowerCase() === artistFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesArtist;
    });
  }, [campaigns, searchTerm, selectedCategory, artistFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Discover <span className="text-primary">Campaigns</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore live fundraising campaigns from your favourite artists. Invest, support, and
            share in their future success.
          </p>
        </header>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search campaigns or artists..."
              className="w-full md:w-80 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {status === 'pending' ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading campaigns...
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="text-center py-16 text-destructive">
            <p className="text-lg font-medium">Failed to load campaigns.</p>
            <p className="text-sm">Please refresh the page or try again later.</p>
          </div>
        ) : null}

        {status === 'success' && filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No campaigns found.</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : null}

        {status === 'success' && filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="p-6 space-y-4 hover:border-primary/50 transition-all hover-lift"
              >
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs uppercase px-2 py-1 rounded-full">
                    {campaign.category || 'Campaign'}
                  </Badge>
                  <Link to={`/campaigns/${campaign.id}`}>
                    <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                      {campaign.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{campaign.artistName ?? 'Unknown Artist'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Funding Goal</div>
                      <div className="font-semibold">{formatCurrency(campaign.fundingGoal)} IDRX</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Raised</div>
                      <div className="font-semibold">
                        {formatCurrency(campaign.currentFunding)} IDRX
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Supporter Share: <strong>{campaign.profitShare.fan}%</strong>
                  </span>
                  <span>Status: <strong className="capitalize">{campaign.status}</strong></span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link to={`/campaigns/${campaign.id}`} className="flex-1">
                    <Button className="w-full rounded-lg gradient-primary text-primary-foreground">
                      View Campaign
                      <ArrowUpRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
