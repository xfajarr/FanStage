import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import { mockFanTokens, mockStakingPositions } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Staking() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    toast.success(`Successfully staked ${stakeAmount} tokens!`);
    setStakeAmount('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Token <span className="text-primary">Staking</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Stake artist tokens to earn yield and unlock exclusive benefits
          </p>
        </div>

        <Tabs defaultValue="stake" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
          </TabsList>

          <TabsContent value="stake">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Token List */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold mb-4">Available Tokens</h2>
                {mockFanTokens.map((token) => (
                  <Card
                    key={token.id}
                    className={`p-6 cursor-pointer transition-all ${
                      selectedToken === token.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedToken(token.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{token.symbol}</h3>
                          <Badge variant="outline">{token.artistName}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {token.holders.toLocaleString()} holders • Market Cap: $
                          {(token.marketCap / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${token.currentPrice}</div>
                        <div
                          className={`flex items-center gap-1 text-sm ${
                            token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {token.change24h >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>
                            {token.change24h >= 0 ? '+' : ''}
                            {token.change24h}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-accent">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">APY</div>
                        <div className="font-bold text-primary">12.5%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Min. Stake</div>
                        <div className="font-bold">100 {token.symbol}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Lock Period</div>
                        <div className="font-bold">30 days</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Stake Form */}
              <div>
                <Card className="p-6 sticky top-24">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Stake Tokens
                  </h3>

                  {selectedToken ? (
                    <div className="space-y-6">
                      <div>
                        <Label>Selected Token</Label>
                        <div className="mt-2 p-3 rounded-lg bg-accent">
                          <div className="font-semibold">
                            {mockFanTokens.find((t) => t.id === selectedToken)?.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mockFanTokens.find((t) => t.id === selectedToken)?.artistName}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="amount">Amount to Stake</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="rounded-lg mt-2"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Minimum: 100 tokens
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-accent space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">APY</span>
                          <span className="font-semibold text-primary">12.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Lock Period</span>
                          <span className="font-semibold">30 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Yield (30d)</span>
                          <span className="font-semibold text-green-600">
                            {stakeAmount
                              ? ((parseFloat(stakeAmount) * 0.125) / 12).toFixed(2)
                              : '0.00'}{' '}
                            tokens
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleStake}
                        className="w-full rounded-lg gradient-primary text-primary-foreground"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Stake Now
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Your tokens will be locked for 30 days. You can claim rewards at any
                        time.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Select a token to start staking
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="positions">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Active Staking Positions</h2>
              {mockStakingPositions.map((position) => (
                <Card key={position.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">
                        {position.artistName} ({position.tokenSymbol})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Staking since {new Date(position.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Staked</div>
                        <div className="font-bold">
                          {position.stakedAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">APY</div>
                        <div className="font-bold text-primary">{position.apy}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Earned</div>
                        <div className="font-bold text-green-600">
                          ${position.earnedYield.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" size="sm" className="rounded-lg">
                          Claim Rewards
                        </Button>
                      </div>
                    </div>
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
