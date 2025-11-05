import { format } from 'date-fns';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/layout/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import useAllArtistsList from '@/features/artists/useAllArtistsList';

export default function Artists() {
  const { artists, status } = useAllArtistsList();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover <span className="text-primary">Artists</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse all artists who have minted their on-chain identity on FanStage.
          </p>
        </header>

        {status === 'pending' ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading artists from the blockchain...
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="text-center py-16 text-destructive">
            <p className="text-lg font-medium">Failed to load artists.</p>
            <p className="text-sm">Please refresh the page or try again later.</p>
          </div>
        ) : null}

        {status === 'success' && artists.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No artists found yet.</p>
            <p className="text-sm">
              Be the first to register as an artist and launch a campaign.
            </p>
          </div>
        ) : null}

        {status === 'success' && artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artists.map((artist) => (
              <Card
                key={artist.address}
                className="p-6 space-y-5 hover:border-primary/50 transition-all hover-lift"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border border-primary/20">
                    <AvatarFallback>
                      {artist.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{artist.name}</h3>
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-mono text-sm text-muted-foreground break-all">
                      {artist.address}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Joined{' '}
                  {artist.createdAt
                    ? format(artist.createdAt, 'MMM d, yyyy')
                    : 'Unknown date'}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 rounded-full text-xs uppercase">
                    On-Chain Artist
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() =>
                      window.open(
                        `https://basescan.org/address/${artist.address}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    Explorer
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                  <Link to={`/campaigns?artist=${artist.address}`} className="flex-1">
                    <Button className="w-full rounded-lg gradient-primary text-primary-foreground">
                      View Campaigns
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
