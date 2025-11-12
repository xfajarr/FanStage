import { CampaignStatus } from '@/services/contracts';

export interface CampaignStatusInfo {
  status: 'active' | 'funded' | 'completed' | 'failed';
  label: string;
  color: string;
  description: string;
}

export interface CampaignData {
  fundingGoal: string | number;
  currentFunding: string | number;
  deadline: string;
  endDate?: string;
  contractStatus?: CampaignStatus;
  totalRevenue?: string | number;
}

/**
 * Centralized campaign status calculation
 * Determines the correct status based on funding progress, deadline, and contract state
 */
export function calculateCampaignStatus(data: CampaignData): CampaignStatusInfo {
  const fundingGoal = Number(data.fundingGoal) || 0;
  const currentFunding = Number(data.currentFunding) || 0;
  const totalRevenue = Number(data.totalRevenue) || 0;
  
  // Use deadline or endDate
  const deadline = new Date(data.deadline || data.endDate || '');
  const now = new Date();
  const isExpired = deadline.getTime() < now.getTime();
  
  const fundingPercentage = fundingGoal > 0 ? (currentFunding / fundingGoal) * 100 : 0;
  const isFullyFunded = fundingPercentage >= 100;
  
  // Priority order for status determination:
  
  // 1. If contract shows Completed status
  if (data.contractStatus === CampaignStatus.Completed) {
    return {
      status: 'completed',
      label: 'Completed',
      color: 'bg-green-500',
      description: 'Campaign completed successfully'
    };
  }
  
  // 2. If revenue has been distributed (indicates completion)
  if (totalRevenue > 0) {
    return {
      status: 'completed',
      label: 'Funds Distributed',
      color: 'bg-green-500',
      description: 'Funds have been distributed'
    };
  }
  
  // 3. If fully funded but no revenue distributed yet
  if (isFullyFunded) {
    return {
      status: 'funded',
      label: 'Goal Reached',
      color: 'bg-blue-500',
      description: 'Funding goal reached'
    };
  }
  
  // 4. If deadline passed without full funding
  if (isExpired && !isFullyFunded) {
    return {
      status: 'failed',
      label: 'Ended',
      color: 'bg-gray-500',
      description: 'Campaign ended without reaching goal'
    };
  }
  
  // 5. Default: still active
  return {
    status: 'active',
    label: 'Active',
    color: 'bg-orange-500',
    description: 'Campaign is currently active'
  };
}

/**
 * Calculate funding progress percentage
 */
export function calculateFundingProgress(fundingGoal: string | number, currentFunding: string | number): number {
  const goal = Number(fundingGoal) || 0;
  const current = Number(currentFunding) || 0;
  
  if (goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}

/**
 * Calculate days remaining
 */
export function calculateDaysRemaining(deadline: string): number {
  const endDate = new Date(deadline);
  const now = new Date();
  
  return Math.max(
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
}

/**
 * Format currency with appropriate units (K, M)
 */
export function formatCampaignCurrency(value: string | number): string {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0';
  
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}K`;
  }
  return numeric.toLocaleString();
}