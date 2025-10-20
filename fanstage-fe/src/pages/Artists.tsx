import Navigation from '@/components/layout/Navigation';
import { mockUsers, mockFanTokens } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, TrendingUp, Users, Instagram, Twitter, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Artists() {
  const artists = mockUsers.filter((user) => user.role === 'artist');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover <span className="text-primary">Artists</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Support talented artists and grow with their success
          </p>
        </div>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artists.map((artist) => {
            const token = mockFanTokens.find((t) => t.artistId === artist.id);
            
            return (
              <Card
                key={artist.id}
                className="p-6 hover:border-primary/50 hover-lift transition-all"
              >
                {/* Artist Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    <AvatarImage src={artist.avatar} />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{artist.name}</h3>
                      {artist.verified && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="capitalize"
                    >
                      {artist.artistTier?.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {artist.bio}
                </p>

                {/* Social Links */}
                {artist.socialLinks && (
                  <div className="flex gap-2 mb-4">
                    {artist.socialLinks.twitter && (
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {artist.socialLinks.instagram && (
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <Instagram className="h-4 w-4" />
                      </Button>
                    )}
                    {artist.socialLinks.spotify && (
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <Music className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Token Stats */}
                {token && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-accent mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Token Price</div>
                      <div className="font-bold">${token.currentPrice}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                      <div className="font-bold">${(token.marketCap / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">24h Change</div>
                      <div
                        className={`font-bold ${
                          token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {token.change24h >= 0 ? '+' : ''}
                        {token.change24h}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Holders</div>
                      <div className="font-bold">{token.holders.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/campaigns?artist=${artist.id}`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-lg">
                      View Campaigns
                    </Button>
                  </Link>
                  {token && (
                    <Link to="/staking" className="flex-1">
                      <Button className="w-full rounded-lg gradient-primary text-primary-foreground">
                        Stake {token.symbol}
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
