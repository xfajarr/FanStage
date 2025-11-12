import { useState, useMemo, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Loader2, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useFundCampaign,
  useIdrxBalance,
  useIdrxAllowanceForCampaign,
  useApproveIdrxForCampaign,
  useTransactionReceipt,
} from '@/services/contracts';
import { formatIDRX } from '@/utils/currency';

interface InvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignContract: string;
  campaignTitle: string;
  targetAmount: string;
  currentFunding: string;
  campaignStatus: string;
  campaignEndDate: string;
  onInvestmentSuccess?: () => void;
}

export default function InvestmentModal({
  open,
  onOpenChange,
  campaignContract,
  campaignTitle,
  targetAmount,
  currentFunding,
  campaignStatus,
  campaignEndDate,
  onInvestmentSuccess,
}: InvestmentModalProps) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [investmentAmount, setInvestmentAmount] = useState('');

  const accountAddress = (address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
  const campaignContractAddress = campaignContract.toLowerCase() as `0x${string}`;

  // Contract hooks
  const idrxBalance = useIdrxBalance(accountAddress);
  const idrxAllowance = useIdrxAllowanceForCampaign(accountAddress, campaignContractAddress);
  const { fund, hash: fundHash, error: fundError, isPending: isFunding } = useFundCampaign();
  const {
    approveForCampaign,
    hash: approveHash,
    error: approveError,
    isPending: isApproving,
  } = useApproveIdrxForCampaign();

  const { data: fundReceipt, isLoading: isFundConfirming } = useTransactionReceipt(fundHash);
  const { data: approveReceipt, isLoading: isApproveConfirming } =
    useTransactionReceipt(approveHash);

  const investmentAmountNum = useMemo(() => parseFloat(investmentAmount || '0'), [investmentAmount]);
  const idrxBalanceNum = useMemo(() => parseFloat(idrxBalance), [idrxBalance]);
  const idrxAllowanceNum = useMemo(() => parseFloat(idrxAllowance), [idrxAllowance]);

  const hasSufficientBalance = useMemo(() => {
    return investmentAmountNum > 0 && idrxBalanceNum >= investmentAmountNum;
  }, [investmentAmountNum, idrxBalanceNum]);

  const hasSufficientAllowance = useMemo(() => {
    return investmentAmountNum > 0 && idrxAllowanceNum >= investmentAmountNum;
  }, [investmentAmountNum, idrxAllowanceNum]);

  const needsApproval = useMemo(() => {
    return investmentAmountNum > 0 && !hasSufficientAllowance;
  }, [investmentAmountNum, hasSufficientAllowance]);

  const isNetworkMismatched = chainId !== undefined && chainId !== baseSepolia.id;

  // Check if campaign has ended
  const isCampaignEnded = useMemo(() => {
    if (campaignStatus === 'Ended') return true;
    const endDate = new Date(campaignEndDate);
    return Date.now() > endDate.getTime();
  }, [campaignStatus, campaignEndDate]);

  // Handle approval success
  useEffect(() => {
    if (approveReceipt && approveReceipt.status === 'success') {
      toast.success('IDRX approved successfully! You can now invest.');
    }
  }, [approveReceipt]);

  // Handle fund success
  useEffect(() => {
    if (fundReceipt && fundReceipt.status === 'success') {
      toast.success(`Successfully invested ${investmentAmount} IDRX!`);
      setInvestmentAmount('');
      onOpenChange(false);
      if (onInvestmentSuccess) {
        onInvestmentSuccess();
      }
    }
  }, [fundReceipt, investmentAmount, onOpenChange, onInvestmentSuccess]);

  // Handle errors
  useEffect(() => {
    if (fundError) {
      console.error('Fund error:', fundError);
      toast.error(fundError.message ?? 'Failed to invest in campaign');
    }
  }, [fundError]);

  useEffect(() => {
    if (approveError) {
      console.error('Approve error:', approveError);
      toast.error(approveError.message ?? 'Failed to approve IDRX');
    }
  }, [approveError]);

  const handleApprove = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isCampaignEnded) {
      toast.error('This campaign has ended and is no longer accepting investments');
      return;
    }

    if (chainId !== baseSepolia.id) {
      toast.error('Please switch to Base Sepolia network');
      try {
        await switchChain({ chainId: baseSepolia.id });
      } catch (error) {
        toast.error('Failed to switch network');
      }
      return;
    }

    if (!investmentAmount || investmentAmountNum <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. You have ${idrxBalance} IDRX`);
      return;
    }

    try {
      await approveForCampaign(campaignContractAddress, investmentAmount);
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve IDRX');
    }
  };

  const handleInvest = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isCampaignEnded) {
      toast.error('This campaign has ended and is no longer accepting investments');
      return;
    }

    if (chainId !== baseSepolia.id) {
      toast.error('Please switch to Base Sepolia network');
      try {
        await switchChain({ chainId: baseSepolia.id });
      } catch (error) {
        toast.error('Failed to switch network');
      }
      return;
    }

    if (!investmentAmount || investmentAmountNum <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. You have ${idrxBalance} IDRX`);
      return;
    }

    if (!hasSufficientAllowance) {
      toast.error('Please approve IDRX spending first');
      return;
    }

    try {
      await fund(campaignContractAddress, investmentAmount);
    } catch (error) {
      console.error('Fund error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to invest in campaign');
    }
  };

  const setMaxAmount = () => {
    const remaining = parseFloat(targetAmount) - parseFloat(currentFunding);
    const maxInvestment = Math.min(idrxBalanceNum, remaining);
    setInvestmentAmount(maxInvestment.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invest in {campaignTitle}</DialogTitle>
          <DialogDescription>
            Enter the amount of IDRX you want to invest in this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isCampaignEnded && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Campaign Ended</p>
                <p className="text-xs mt-1">
                  This campaign has reached its deadline and is no longer accepting investments.
                </p>
              </div>
            </div>
          )}

          {!isCampaignEnded && isNetworkMismatched && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Wrong Network</p>
                <p className="text-xs mt-1">Please switch to Base Sepolia to continue.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (IDRX)</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                disabled={isFunding || isApproving || isFundConfirming || isApproveConfirming}
              />
              <Button
                type="button"
                variant="outline"
                onClick={setMaxAmount}
                disabled={isFunding || isApproving || isFundConfirming || isApproveConfirming}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-medium">{formatIDRX(idrxBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Funding:</span>
              <span className="font-medium">{formatIDRX(currentFunding)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Funding Goal:</span>
              <span className="font-medium">{formatIDRX(targetAmount)}</span>
            </div>
            {investmentAmountNum > 0 && (
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">You will invest:</span>
                <span className="font-semibold text-primary">{formatIDRX(investmentAmount)}</span>
              </div>
            )}
          </div>

          {needsApproval && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Approval Required</p>
                <p className="text-xs mt-1">
                  You need to approve IDRX spending before investing.
                </p>
              </div>
            </div>
          )}

          {!hasSufficientBalance && investmentAmountNum > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Insufficient Balance</p>
                <p className="text-xs mt-1">
                  You don't have enough IDRX. Your balance: {formatIDRX(idrxBalance)}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isFunding || isApproving || isFundConfirming || isApproveConfirming}>
            Cancel
          </Button>

          {needsApproval ? (
            <Button
              onClick={handleApprove}
              disabled={
                isCampaignEnded ||
                !address ||
                isNetworkMismatched ||
                !investmentAmount ||
                investmentAmountNum <= 0 ||
                !hasSufficientBalance ||
                isApproving ||
                isApproveConfirming
              }
              className="gradient-primary"
            >
              {isApproving || isApproveConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isApproving ? 'Approving...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve IDRX
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleInvest}
              disabled={
                isCampaignEnded ||
                !address ||
                isNetworkMismatched ||
                !investmentAmount ||
                investmentAmountNum <= 0 ||
                !hasSufficientBalance ||
                !hasSufficientAllowance ||
                isFunding ||
                isFundConfirming
              }
              className="gradient-primary"
            >
              {isFunding || isFundConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isFunding ? 'Investing...' : 'Confirming...'}
                </>
              ) : (
                <>
                  Invest Now
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
