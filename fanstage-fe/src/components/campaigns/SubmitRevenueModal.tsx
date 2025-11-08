import { useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Loader2, TrendingUp, Users, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useSubmitRevenue,
  useTransactionReceipt,
} from '@/services/contracts';
import { formatIDRX } from '@/utils/currency';
import { toast } from 'sonner';

interface SubmitRevenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignContract: string;
  campaignTitle: string;
  funderSharePercent: number;
  totalRaised: number;
  fundersCount: number;
  onRevenueSubmitted?: () => void;
}

export default function SubmitRevenueModal({
  open,
  onOpenChange,
  campaignContract,
  campaignTitle,
  funderSharePercent,
  totalRaised,
  fundersCount,
  onRevenueSubmitted,
}: SubmitRevenueModalProps) {
  const { address } = useAccount();

  // Submit revenue hook
  const {
    submitRevenue,
    hash: submitHash,
    error: submitError,
    isPending: isSubmitPending,
  } = useSubmitRevenue();

  const {
    isLoading: isSubmitConfirming,
    isSuccess: isSubmitSuccess,
  } = useTransactionReceipt(submitHash);

  // Calculate revenue split
  const revenueSplit = useMemo(() => {
    const backersShare = (totalRaised * funderSharePercent) / 100;
    const artistShare = totalRaised - backersShare;
    return { backersShare, artistShare };
  }, [totalRaised, funderSharePercent]);

  // Handle submit success
  useEffect(() => {
    if (isSubmitSuccess) {
      toast.success('Funds distributed successfully!');
      onRevenueSubmitted?.();
      handleClose();
    }
  }, [isSubmitSuccess, onRevenueSubmitted]);

  // Handle submit error
  useEffect(() => {
    if (submitError) {
      toast.error('Failed to distribute funds');
      console.error('Submit error:', submitError);
    }
  }, [submitError]);

  const handleSubmit = async () => {
    try {
      await submitRevenue(campaignContract as `0x${string}`);
    } catch (error) {
      console.error('Error submitting revenue:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isProcessing = isSubmitPending || isSubmitConfirming;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Distribute Campaign Funds</DialogTitle>
          <DialogDescription>
            Distribute raised funds for <span className="font-semibold">{campaignTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campaign Info */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Total Raised</span>
              </div>
              <span className="font-semibold text-lg">{formatIDRX(totalRaised)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Backers</span>
              </div>
              <span className="font-medium">{fundersCount}</span>
            </div>
          </div>

          {/* Distribution Preview */}
          <div className="space-y-3 p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Distribution Breakdown</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backers Pool ({funderSharePercent}%)</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatIDRX(revenueSplit.backersShare)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Your Share ({100 - funderSharePercent}%)</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatIDRX(revenueSplit.artistShare)}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">About Distribution</p>
              <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">
                This will distribute the raised funds. You'll receive your share immediately,
                and backers can claim their profit shares based on their tier levels.
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
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 gradient-primary"
            >
              {isSubmitPending || isSubmitConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSubmitPending ? 'Processing...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Distribute Funds
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
