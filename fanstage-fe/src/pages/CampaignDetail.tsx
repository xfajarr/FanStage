import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/layout/Navigation';
import { mockCampaigns } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Clock,
  TrendingUp,
  Users,
  Share2,
  Heart,
  CheckCircle,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignDetail() {
  const { id } = useParams();
  const campaign = mockCampaigns.find((c) => c.id === id);
  const [investAmount, setInvestAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  if (!campaign) {
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

  const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;
  const daysRemaining = Math.ceil(
    (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleInvest = () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }
    toast.success(`Successfully invested $${investAmount} in ${campaign.title}!`);
    setInvestAmount('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/campaigns">
          <Button variant="ghost" className="mb-6 rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={campaign.coverImage}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-4 right-4 capitalize bg-primary text-primary-foreground">
                {campaign.category.replace('-', ' ')}
              </Badge>
            </div>

            {/* Artist Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={campaign.artistAvatar} />
                <AvatarFallback>{campaign.artistName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm text-muted-foreground">Created by</div>
                <Link to={`/artists/${campaign.artistId}`}>
                  <h3 className="text-xl font-bold hover:text-primary transition-colors">
                    {campaign.artistName}
                  </h3>
                </Link>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{campaign.title}</h1>
              <p className="text-lg text-muted-foreground">{campaign.description}</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start rounded-lg">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Campaign Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Funding Goal</h4>
                      <p className="text-muted-foreground">
                        This campaign aims to raise ${campaign.fundingGoal.toLocaleString()} to
                        fund {campaign.category} production and execution.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Profit Sharing</h4>
                      <p className="text-muted-foreground">
                        Supporters will receive {campaign.profitShare.fan}% of profits generated
                        from this campaign, while {campaign.artistName} retains{' '}
                        {campaign.profitShare.artist}%.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Timeline</h4>
                      <p className="text-muted-foreground">
                        Campaign runs from {new Date(campaign.startDate).toLocaleDateString()} to{' '}
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="mt-6">
                <div className="grid gap-4">
                  {campaign.rewards.map((reward) => (
                    <Card
                      key={reward.id}
                      className={`p-6 cursor-pointer transition-all ${
                        selectedTier === reward.id
                          ? 'ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTier(reward.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold">{reward.name}</h4>
                          <p className="text-2xl font-bold text-primary mt-1">
                            ${reward.minInvestment}+
                          </p>
                        </div>
                        {reward.limited && (
                          <Badge variant="outline">
                            {reward.available} remaining
                          </Badge>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {reward.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="updates" className="mt-6">
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No updates yet</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Investment Card */}
            <Card className="p-6 sticky top-24">
              <div className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-3xl font-bold text-primary">
                      ${campaign.currentFunding.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ${campaign.fundingGoal.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={fundingPercentage} className="h-3 mb-2" />
                  <p className="text-sm font-medium">{fundingPercentage.toFixed(1)}% funded</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Backers</span>
                    </div>
                    <div className="text-2xl font-bold">{campaign.backerCount}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Days Left</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{daysRemaining}</div>
                  </div>
                </div>

                {/* Profit Share */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="text-sm">
                    <span className="font-semibold">{campaign.profitShare.fan}%</span> profit share
                    for supporters
                  </div>
                </div>

                {/* Investment Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Investment Amount (USD)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      className="pl-10 rounded-lg"
                      min="0"
                      step="1"
                    />
                  </div>
                  <Button
                    onClick={handleInvest}
                    className="w-full rounded-lg gradient-primary text-primary-foreground shadow-medium hover:shadow-strong transition-all"
                    size="lg"
                  >
                    Invest Now
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By investing, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
