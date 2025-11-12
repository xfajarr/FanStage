import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, History, Loader2, ExternalLink } from 'lucide-react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MockIDRXABI from '@/contracts/ABI/MockIDRX.json';
import contractAddresses from '@/contracts/addresses.json';
import { graphqlQuery, IDRX_QUERIES, type GetUserIDRXHistoryResponse, type IndexedIDRXTransaction } from '@/services/graphql';

const MOCK_IDRX_ADDRESS = contractAddresses.baseSepolia.MockIDRX as `0x${string}`;

// Combined transaction type for display
interface DisplayTransaction {
  id: string;
  type: 'onramp' | 'offramp';
  amount: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export default function Exchange() {
  const { address } = useAccount();
  const [onRampAmount, setOnRampAmount] = useState('');
  const [offRampAmount, setOffRampAmount] = useState('');

  // Get IDRX balance
  const { data: idrxBalance } = useReadContract({
    address: MOCK_IDRX_ADDRESS,
    abi: MockIDRXABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  // Get ETH balance for gas fees
  const { data: ethBalance } = useBalance({
    address,
  });

  // Fetch transaction history from indexer
  const {
    data: transactionHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['idrx-history', address],
    queryFn: async (): Promise<DisplayTransaction[]> => {
      if (!address) return [];

      try {
        const response = await graphqlQuery<GetUserIDRXHistoryResponse>(
          IDRX_QUERIES.GET_USER_IDRX_HISTORY,
          { userAddress: address.toLowerCase() }
        );

        // Combine and transform onRamp and offRamp transactions
        const transactions: DisplayTransaction[] = [];

        // Add onRamp transactions
        response.onRamps.forEach((tx) => {
          transactions.push({
            id: `onramp-${tx.id}`,
            type: 'onramp',
            amount: formatUnits(BigInt(tx.amount), 2),
            timestamp: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            blockNumber: tx.blockNumber,
            transactionHash: tx.transactionHash,
          });
        });

        // Add offRamp transactions
        response.offRamps.forEach((tx) => {
          transactions.push({
            id: `offramp-${tx.id}`,
            type: 'offramp',
            amount: formatUnits(BigInt(tx.amount), 2),
            timestamp: new Date(Number(tx.blockTimestamp) * 1000).toISOString(),
            blockNumber: tx.blockNumber,
            transactionHash: tx.transactionHash,
          });
        });

        // Sort by timestamp (newest first)
        return transactions.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }
    },
    enabled: !!address,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // On-ramp transaction
  const {
    writeContract: onRamp,
    data: onRampHash,
    isPending: isOnRampPending,
  } = useWriteContract();

  const { isLoading: isOnRampConfirming } = useWaitForTransactionReceipt({
    hash: onRampHash,
    query: {
      enabled: !!onRampHash,
      onSuccess: () => {
        toast.success('On-ramp successful! IDRX tokens deposited to your wallet.');
        setOnRampAmount('');
        refetchHistory(); // Refresh transaction history
      },
      onError: () => {
        toast.error('On-ramp failed. Please try again.');
      },
    },
  });

  // Off-ramp transaction
  const {
    writeContract: offRamp,
    data: offRampHash,
    isPending: isOffRampPending,
  } = useWriteContract();

  const { isLoading: isOffRampConfirming } = useWaitForTransactionReceipt({
    hash: offRampHash,
    query: {
      enabled: !!offRampHash,
      onSuccess: () => {
        toast.success('Off-ramp successful! Fiat currency will be credited to your bank account.');
        setOffRampAmount('');
        refetchHistory(); // Refresh transaction history
      },
      onError: () => {
        toast.error('Off-ramp failed. Please try again.');
      },
    },
  });

  const handleOnRamp = () => {
    if (!onRampAmount || !address) return;
    
    try {
      const amount = parseUnits(onRampAmount, 2); // IDRX has 2 decimals
      onRamp({
        address: MOCK_IDRX_ADDRESS,
        abi: MockIDRXABI,
        functionName: 'onRamp',
        args: [amount],
      });
    } catch (error) {
      toast.error('Invalid amount. Please enter a valid number.');
    }
  };

  const handleOffRamp = () => {
    if (!offRampAmount || !address || !idrxBalance) return;
    
    try {
      const amount = parseUnits(offRampAmount, 2); // IDRX has 2 decimals
      
      if (amount > idrxBalance) {
        toast.error('Insufficient IDRX balance.');
        return;
      }

      offRamp({
        address: MOCK_IDRX_ADDRESS,
        abi: MockIDRXABI,
        functionName: 'offRamp',
        args: [amount],
      });
    } catch (error) {
      toast.error('Invalid amount. Please enter a valid number.');
    }
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0.00';
    return formatUnits(balance, 2);
  };

  const maxOnRamp = () => {
    setOnRampAmount('10000'); // Set max to 10,000 IDRX for demo
  };

  const maxOffRamp = () => {
    if (idrxBalance) {
      setOffRampAmount(formatBalance(idrxBalance));
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <Card className="max-w-md mx-auto p-8">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access IDRX on-ramp and off-ramp services.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">IDRX Wallet</h1>
          <p className="text-muted-foreground">
            Convert between Indonesian Rupiah and IDRX tokens for seamless platform transactions
          </p>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline">IDRX</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{formatBalance(idrxBalance)}</div>
            <div className="text-sm text-muted-foreground">IDRX Balance</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline">ETH</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.0000'}
            </div>
            <div className="text-sm text-muted-foreground">ETH Balance (for gas)</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="outline">Exchange Rate</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">1:1</div>
            <div className="text-sm text-muted-foreground">IDR to IDRX</div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="onramp" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="onramp" className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Buy IDRX
            </TabsTrigger>
            <TabsTrigger value="offramp" className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Sell IDRX
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="onramp">
            <Card className="p-6">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-6 text-center">Buy IDRX Tokens</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="onramp-amount">Amount (IDRX)</Label>
                    <div className="relative">
                      <Input
                        id="onramp-amount"
                        type="number"
                        placeholder="1000.00"
                        value={onRampAmount}
                        onChange={(e) => setOnRampAmount(e.target.value)}
                        className="rounded-lg text-lg pr-20"
                        min="0"
                        step="0.01"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-6 text-xs"
                        onClick={maxOnRamp}
                      >
                        MAX
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You will pay: {onRampAmount || '0'} IDR (simulated)
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">1 IDR = 1 IDRX</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span>Processing Fee:</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleOnRamp}
                    disabled={!onRampAmount || isOnRampPending || isOnRampConfirming}
                    className="w-full rounded-lg gradient-primary text-primary-foreground"
                    size="lg"
                  >
                    {isOnRampPending || isOnRampConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isOnRampPending ? 'Confirming...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Buy IDRX
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>⚡ Instant processing via blockchain</p>
                    <p>🔒 Secure and transparent transactions</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="offramp">
            <Card className="p-6">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-6 text-center">Sell IDRX Tokens</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="offramp-amount">Amount (IDRX)</Label>
                    <div className="relative">
                      <Input
                        id="offramp-amount"
                        type="number"
                        placeholder="0.00"
                        value={offRampAmount}
                        onChange={(e) => setOffRampAmount(e.target.value)}
                        className="rounded-lg text-lg pr-20"
                        min="0"
                        step="0.01"
                        max={formatBalance(idrxBalance)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-6 text-xs"
                        onClick={maxOffRamp}
                      >
                        MAX
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You will receive: {offRampAmount || '0'} IDR (simulated)
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">1 IDRX = 1 IDR</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span>Available Balance:</span>
                      <span className="font-medium text-primary">{formatBalance(idrxBalance)} IDRX</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleOffRamp}
                    disabled={!offRampAmount || isOffRampPending || isOffRampConfirming || !idrxBalance}
                    className="w-full rounded-lg"
                    size="lg"
                    variant="destructive"
                  >
                    {isOffRampPending || isOffRampConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isOffRampPending ? 'Confirming...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 mr-2" />
                        Sell IDRX
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>💰 Funds credited to your bank account (simulated)</p>
                    <p>⚡ Processing time: 1-3 business days</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Transaction History</h3>
              
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Loading transaction history...
                </div>
              ) : historyError ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">Failed to load history</h4>
                  <p className="text-sm">
                    Unable to fetch transaction history. Please try again later.
                  </p>
                </div>
              ) : !transactionHistory || transactionHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No transactions yet</h4>
                  <p className="text-sm">
                    Your on-ramp and off-ramp transactions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactionHistory.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'onramp' 
                              ? 'bg-green-500/10 text-green-600' 
                              : 'bg-red-500/10 text-red-600'
                          }`}>
                            {transaction.type === 'onramp' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'onramp' ? 'On-Ramp' : 'Off-Ramp'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.timestamp).toLocaleDateString()} at{' '}
                              {new Date(transaction.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            transaction.type === 'onramp' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'onramp' ? '+' : '-'}{transaction.amount} IDRX
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Block #{transaction.blockNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transaction.type === 'onramp' ? 'Buy' : 'Sell'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(
                              `https://sepolia.basescan.org/tx/${transaction.transactionHash}`,
                              '_blank'
                            )}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">How IDRX Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                On-Ramp (Buy IDRX)
              </h4>
              <p className="text-sm text-muted-foreground">
                Convert your Indonesian Rupiah to IDRX tokens for investing in artist campaigns, 
                funding projects, and participating in the FanStage ecosystem.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
                Off-Ramp (Sell IDRX)
              </h4>
              <p className="text-sm text-muted-foreground">
                Convert your IDRX tokens back to Indonesian Rupiah when you want to withdraw 
                your profits or exit the platform.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}