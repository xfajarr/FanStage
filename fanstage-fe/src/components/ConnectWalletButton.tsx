import { useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Wallet, LogOut, ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function ConnectWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const wallet = useMemo(
    () => wallets.find((w) => w.type === "ethereum"),
    [wallets]
  );

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await logout();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleNetworkSwitch = (network: string) => {
    // Implement network switching logic here
    console.log(`Switching to ${network} network`);
  };

  if (!ready || !walletsReady) {
    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        className="rounded-lg opacity-50 cursor-not-allowed animate-pulse"
      >
        <div className="h-4 w-4 rounded-full bg-muted animate-spin mr-2" />
        Loading…
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        size="sm"
        className="rounded-lg gradient-primary text-primary-foreground shadow-medium hover:shadow-strong transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:opacity-70"
      >
        {isConnecting ? (
          <>
            <div className="h-4 w-4 rounded-full bg-primary-foreground/30 animate-spin mr-2" />
            Connecting…
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // Sudah login: tampilkan address + menu dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg font-mono text-xs hover:bg-accent/50 transition-all duration-300 group"
        >
          {short(wallet?.address) || user?.wallet?.address || "Connected"}
          <ChevronDown className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg border-border/50 bg-card/95 backdrop-blur-sm shadow-medium">
        <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border/50">
          Wallet Address
        </div>
        <div className="px-2 py-1.5 font-mono text-xs">
          {wallet?.address || user?.wallet?.address || "Connected"}
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Network
        </div>
        <DropdownMenuItem onClick={() => handleNetworkSwitch("ethereum")} className="rounded-md cursor-pointer">
          <Layers className="mr-2 h-3 w-3" />
          Ethereum
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNetworkSwitch("polygon")} className="rounded-md cursor-pointer">
          <Layers className="mr-2 h-3 w-3" />
          Polygon
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNetworkSwitch("arbitrum")} className="rounded-md cursor-pointer">
          <Layers className="mr-2 h-3 w-3" />
          Arbitrum
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="rounded-md cursor-pointer text-destructive focus:text-destructive"
        >
          {isDisconnecting ? (
            <>
              <div className="h-3 w-3 rounded-full bg-destructive/30 animate-spin mr-2" />
              Disconnecting…
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-3 w-3" />
              Disconnect
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
