import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Loader2, Wallet, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useClaimRevenue,
  useTransactionReceipt,
} from '@/services/contracts';
import { formatIDRX } from '@/utils/currency';
import { toast } from 'sonner';

interface ClaimRevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignContract: string;
  campaignTitle: string;
  claimableAmount: number;
  investedAmount: number;
  onRevenueClaimed?: () => void;
}

export default function ClaimRevenueModal({
  open,
  onOpenChange,
  campaignContract,
  campaignTitle,
  claimableAmount,
  investedAmount,
  onRevenueClaimed,
}: ClaimRevenueModalProps) {
  const { address } = useAccount();

  // Claim revenue hook
  const {
    claimRevenue,
    hash: claimHash,
    error: claimError,
    isPending: isClaimPending,
  } = useClaimRevenue();

  const {
    isLoading: isClaimConfirming,
    isSuccess: isClaimSuccess,
  } = useTransactionReceipt(claimHash);


  // Handle claim success
  useEffect(() => {
    if (isClaimSuccess) {
      toast.success('Revenue claimed successfully!');
      onRevenueClaimed?.();
      handleClose();
    }
  }, [isClaimSuccess, onRevenueClaimed]);

  // Handle claim error
  useEffect(() => {
    if (claimError) {
      toast.error('Failed to claim revenue');
      console.error('Claim error:', claimError);
    }
  }, [claimError]);

  const handleClaim = async () => {
    try {
      await claimRevenue(campaignContract as `0x${string}`);
    } catch (error) {
      console.error('Error claiming revenue:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isProcessing = isClaimPending || isClaimConfirming;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Your Profit Share</DialogTitle>
          <DialogDescription>
            Claim your profit from <span className="font-semibold">{campaignTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Investment Summary */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Your Investment</span>
              </div>
              <span className="font-medium">{formatIDRX(investedAmount)}</span>
            </div>
          </div>

          {/* Claimable Amount */}
          <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <DollarSign className="h-4 w-4" />
              <span>Total Claimable Amount</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {formatIDRX(claimableAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Your total return including investment and profit share
            </p>
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">About Claiming</p>
              <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                Your profit share is calculated based on your investment amount and tier level.
                Once claimed, the funds will be transferred to your wallet.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>

            <Button
              onClick={handleClaim}
              disabled={isProcessing}
              className="flex-1 gradient-primary"
            >
              {isClaimPending || isClaimConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isClaimPending ? 'Processing...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Claim Your Share
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
