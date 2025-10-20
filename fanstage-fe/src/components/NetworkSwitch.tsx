import { useChainId, useSwitchChain, useChains } from 'wagmi';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ChevronDown, Loader2 } from 'lucide-react';

const getChainColor = (chainId: number): string => {
  switch (chainId) {
    case 84532: // Base Sepolia
      return '#0052FF';
    case 1: // Ethereum Mainnet
      return '#627EEA';
    default:
      return '#6366f1';
  }
};

const getChainLogo = (chainId: number): string => {
  switch (chainId) {
    case 84532:
      return '/Base_square_blue.svg';
    case 1:
      return '/ethereum-eth-logo.svg';
    default:
      return '';
  }
};

export function NetworkSwitch() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const chains = useChains();

  const getCurrentChain = () => {
    return chains.find(chain => chain.id === chainId);
  };

  const currentChain = getCurrentChain();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-9 px-3"
          disabled={isPending}
        >
          {currentChain && (
            <>
              {getChainLogo(currentChain.id) ? (
                <img 
                  src={getChainLogo(currentChain.id)} 
                  alt={currentChain.name}
                  className="w-4 h-4 rounded"
                />
              ) : (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getChainColor(currentChain.id) }}
                />
              )}
            </>
          )}
          <span className="truncate max-w-24">
            {currentChain?.name || 'Unknown Network'}
          </span>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            className="flex items-center justify-between cursor-pointer"
            disabled={isPending || chain.id === chainId}
          >
            <div className="flex items-center gap-2">
              {getChainLogo(chain.id) ? (
                <img 
                  src={getChainLogo(chain.id)} 
                  alt={chain.name}
                  className="w-4 h-4 rounded"
                />
              ) : (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getChainColor(chain.id) }}
                />
              )}
              <span className="text-sm truncate">{chain.name}</span>
            </div>
            {chain.id === chainId && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}