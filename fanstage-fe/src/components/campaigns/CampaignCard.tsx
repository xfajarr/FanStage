import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CampaignListItem } from '@/services/campaigns';

interface CampaignCardProps {
  campaign: CampaignListItem;
  className?: string;
}

export default function CampaignCard({ campaign, className }: CampaignCardProps) {
  const fundingGoal = Number(campaign.fundingGoal) || 0;
  const currentFunding = Number(campaign.currentFunding) || 0;
  const fundingPercentage = fundingGoal > 0 ? Math.min((currentFunding / fundingGoal) * 100, 100) : 0;
  const daysRemaining = Math.max(
    Math.ceil(
      (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ),
    0
  );

  const categoryColors = {
    concert: 'bg-purple-500/10 text-purple-600 border-purple-200',
    album: 'bg-blue-500/10 text-blue-600 border-blue-200',
    tour: 'bg-green-500/10 text-green-600 border-green-200',
    'music-video': 'bg-pink-500/10 text-pink-600 border-pink-200',
    other: 'bg-gray-500/10 text-gray-600 border-gray-200',
  };

  return (
    <Link to={`/campaigns/${campaign.id}`}>
      <div
        className={cn(
          'group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 shadow-soft hover-lift transition-all',
          className
        )}
      >
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden">
          {campaign.coverImage ? (
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
              No cover image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Category Badge */}
          <Badge
            className={cn(
              'absolute top-4 right-4 capitalize',
              categoryColors[campaign.category]
            )}
          >
            {campaign.category.replace('-', ' ')}
          </Badge>

          {/* Status Badge */}
          {campaign.status === 'funded' && (
            <Badge className="absolute top-4 left-4 bg-green-500 text-white">
              Funded
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Artist Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={campaign.artistAvatar ?? ''} />
              <AvatarFallback>
                {campaign.artistName ? campaign.artistName[0]?.toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-muted-foreground">by</div>
              <div className="font-semibold">{campaign.artistName ?? 'Unknown Artist'}</div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {campaign.description}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold text-primary">
                {currentFunding.toLocaleString()} IDRX
              </span>
              <span className="text-sm text-muted-foreground">
                of {fundingGoal.toLocaleString()} IDRX
              </span>
            </div>
            <Progress value={fundingPercentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{campaign.backerCount}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>{campaign.profitShare.fan}% share</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{daysRemaining}d left</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
