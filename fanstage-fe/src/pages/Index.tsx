import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/layout/Navigation';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { Button } from '@/components/ui/button';
import campaignsApi from '@/services/campaigns';

export default function Index() {
  const { data, status } = useQuery({
    queryKey: ['campaigns', 'featured'],
    queryFn: () => campaignsApi.getCampaigns({ limit: 6 }),
  });

  const featuredCampaigns = data?.campaigns.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Campaigns</h2>
              <p className="text-muted-foreground">
                Support these amazing artists and share in their success.
              </p>
            </div>
            <Link to="/campaigns">
              <Button variant="outline" className="rounded-lg hidden md:flex">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {status === 'pending' ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading featured campaigns...
            </div>
          ) : null}

          {status === 'success' && featuredCampaigns.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg font-medium">No campaigns available yet.</p>
              <p className="text-sm">Be the first to launch a campaign on FanStage.</p>
            </div>
          ) : null}

          {status === 'success' && featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : null}

          <div className="mt-8 text-center md:hidden">
            <Link to="/campaigns">
              <Button variant="outline" className="rounded-lg">
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <span className="text-lg font-bold text-primary-foreground">F</span>
                </div>
                <span className="text-lg font-bold">FanStage</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering artists and fans through Web3 technology.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/campaigns" className="hover:text-primary transition-colors">
                    Campaigns
                  </Link>
                </li>
                <li>
                  <Link to="/artists" className="hover:text-primary transition-colors">
                    Artists
                  </Link>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  Staking
                  <span className="text-xs font-semibold uppercase bg-muted px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Artists</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/register-artist" className="hover:text-primary transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/create-campaign" className="hover:text-primary transition-colors">
                    Create Campaign
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 FanStage. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
