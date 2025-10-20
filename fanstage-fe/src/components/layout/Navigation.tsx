import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ConnectWalletButton from '../ConnectWalletButton';
import { NetworkSwitch } from '../NetworkSwitch';
import { usePrivy } from '@privy-io/react-auth';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Campaigns', path: '/campaigns' },
  { name: 'Artists', path: '/artists' },
  { name: 'Staking', path: '/staking' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Profile', path: '/profile', requiresAuth: true },
] as const;

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authenticated, user } = usePrivy();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-medium">
                <span className="text-xl font-bold text-primary-foreground">F</span>
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              FanStage
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems
              .filter((item) => !('requiresAuth' in item) || !item.requiresAuth || authenticated)
              .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  location.pathname === item.path
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {item.name}
              </Link>
              ))}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
            {authenticated && user ? (
              <>
                <Link to="/portfolio">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    Portfolio
                  </Button>
                </Link>
                <NetworkSwitch />
                <ConnectWalletButton />
              </>
            ) : (
              <ConnectWalletButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-2">
              {navItems
                .filter((item) => !('requiresAuth' in item) || !item.requiresAuth || authenticated)
                .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    location.pathname === item.path
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  >
                  {item.name}
                </Link>
                ))}
              <div className="pt-4 border-t border-border">
                {authenticated && user ? (
                  <>
                    <div className="w-full mb-2">
                      <NetworkSwitch />
                    </div>
                    <Link to="/portfolio">
                      <Button
                        variant="outline"
                        className="w-full mb-2 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Portfolio
                      </Button>
                    </Link>
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg mb-2">
                      <span className="font-mono text-xs">
                        {user?.wallet?.address
                          ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
                          : 'Connected'
                        }
                      </span>
                    </div>
                    <div className="w-full">
                      <ConnectWalletButton />
                    </div>
                  </>
                ) : (
                  <div className="w-full">
                    <ConnectWalletButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
