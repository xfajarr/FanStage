import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useWallets, getAccessToken } from "@privy-io/react-auth";
import { Wallet, LogOut, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function ConnectWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const wasAuthenticated = useRef(authenticated);
  const navigate = useNavigate();

  const wallet = useMemo(
    () => wallets.find((w) => w.type === "ethereum"),
    [wallets]
  );
  const address = wallet?.address || user?.wallet?.address || "";

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
      
      // 🚀 Enhanced logging for debugging
      console.log('🔐 Privy login completed');
      // Test API connection after login
      if (authenticated) {
        try {
          const token = await getAccessToken();
          console.log('🔑 Access token retrieved:', token?.substring(0, 20) + '...');
          
          // Test backend connection
          const response = await fetch('http://localhost:3000/api/auth/health');
          console.log('🏥 Backend health check:', response.status);
          
          if (response.ok) {
            const healthData = await response.json();
            console.log('✅ Backend health:', healthData);
          }
        } catch (error) {
          console.error('❌ Backend connection failed:', error);
        }
      }
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

  const handleCopyAddress = async () => {
    if (!address || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      console.warn("Clipboard API not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  const handleViewOnExplorer = () => {
    if (!address) return;
    const explorerUrl = `https://etherscan.io/address/${address}`;
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!wasAuthenticated.current && authenticated) {
      navigate("/profile");
    }
    wasAuthenticated.current = authenticated;
  }, [authenticated, navigate]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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
          {address || "Connected"}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopyAddress}
          disabled={!address}
          className="rounded-md cursor-pointer"
        >
          <Copy className="mr-2 h-3 w-3" />
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleViewOnExplorer}
          disabled={!address}
          className="rounded-md cursor-pointer"
        >
          <ExternalLink className="mr-2 h-3 w-3" />
          View on Explorer
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
