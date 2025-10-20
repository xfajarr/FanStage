import Navigation from '@/components/layout/Navigation';
import { mockInvestments, mockNFTs, mockStakingPositions } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Wallet, 
  Trophy, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalEarned = mockInvestments.reduce((sum, inv) => sum + (inv.earnedProfit || 0), 0);
  const totalStaked = mockStakingPositions.reduce((sum, pos) => sum + pos.stakedAmount, 0);
  const totalYield = mockStakingPositions.reduce((sum, pos) => sum + pos.earnedYield, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
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
            <div className="text-2xl font-bold mb-1">${totalInvested.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Invested</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold mb-1">${totalEarned.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Profit Earned</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <div className="text-2xl font-bold mb-1">${totalStaked.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Staked</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold mb-1">${totalYield.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Staking Yield</div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="investments" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="nfts">NFT Collection</TabsTrigger>
          </TabsList>

          <TabsContent value="investments">
            <div className="space-y-4">
              {mockInvestments.map((investment) => (
                <Card key={investment.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {investment.campaignTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {investment.artistName}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Invested</div>
                        <div className="font-bold">${investment.amount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Profit Share</div>
                        <div className="font-bold text-primary">{investment.profitShare}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Earned</div>
                        <div className="font-bold text-green-600">
                          ${investment.earnedProfit?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <Badge
                        variant={investment.status === 'active' ? 'default' : 'secondary'}
                      >
                        {investment.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staking">
            <div className="space-y-4">
              {mockStakingPositions.map((position) => (
                <Card key={position.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {position.artistName} ({position.tokenSymbol})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Staking since {new Date(position.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Staked</div>
                        <div className="font-bold">
                          {position.stakedAmount.toLocaleString()} {position.tokenSymbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">APY</div>
                        <div className="font-bold text-primary">{position.apy}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Earned</div>
                        <div className="font-bold text-green-600">
                          ${position.earnedYield.toFixed(2)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        Manage
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nfts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockNFTs.map((nft) => (
                <Card key={nft.id} className="overflow-hidden hover-lift">
                  <div className="aspect-square relative">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 right-4 capitalize">
                      {nft.type.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{nft.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {nft.artistName}
                    </p>
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
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
