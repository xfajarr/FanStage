import Navigation from '@/components/layout/Navigation';
import { mockInvestments, mockNFTs, mockStakingPositions } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
          <p className="text-muted-foreground">
            View all your investments, NFTs, and staking positions
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Assets</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Investments */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Active Investments</h2>
                <div className="space-y-4">
                  {mockInvestments.slice(0, 3).map((inv) => (
                    <Card key={inv.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{inv.campaignTitle}</h3>
                          <p className="text-sm text-muted-foreground">{inv.artistName}</p>
                        </div>
                        <Badge>{inv.status}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Invested: ${inv.amount}</span>
                        <span className="text-green-600">
                          Earned: ${inv.earnedProfit?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* NFTs */}
              <div>
                <h2 className="text-2xl font-bold mb-4">NFT Collection</h2>
                <div className="grid grid-cols-2 gap-4">
                  {mockNFTs.slice(0, 4).map((nft) => (
                    <Card key={nft.id} className="overflow-hidden">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1">{nft.name}</h3>
                        <p className="text-xs text-muted-foreground">{nft.artistName}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <div className="space-y-4">
              {mockInvestments.map((inv) => (
                <Card key={inv.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{inv.campaignTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{inv.artistName}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Invested:</span>
                          <div className="font-bold">${inv.amount}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit Share:</span>
                          <div className="font-bold text-primary">{inv.profitShare}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Earned:</span>
                          <div className="font-bold text-green-600">
                            ${inv.earnedProfit?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>
                      {inv.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nfts">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mockNFTs.map((nft) => (
                <Card key={nft.id} className="overflow-hidden hover-lift">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-4">
                    <Badge className="mb-2 capitalize">{nft.type.replace('-', ' ')}</Badge>
                    <h3 className="font-semibold mb-1 line-clamp-1">{nft.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{nft.artistName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {nft.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="staking">
            <div className="space-y-4">
              {mockStakingPositions.map((pos) => (
                <Card key={pos.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {pos.artistName} ({pos.tokenSymbol})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Staking since {new Date(pos.startDate).toLocaleDateString()}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Staked:</span>
                          <div className="font-bold">
                            {pos.stakedAmount.toLocaleString()} {pos.tokenSymbol}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">APY:</span>
                          <div className="font-bold text-primary">{pos.apy}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Yield Earned:</span>
                          <div className="font-bold text-green-600">
                            ${pos.earnedYield.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge>{pos.status}</Badge>
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
