import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
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

const ADDRESS_STORAGE_KEY = "fanstage:lastWalletAddress";

const short = (addr?: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");

export default function ConnectWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cachedAddress, setCachedAddress] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ADDRESS_STORAGE_KEY) ?? "";
  });
  const copyTimeoutRef = useRef<number | null>(null);
  const wasAuthenticated = useRef(authenticated);
  const navigate = useNavigate();

  const wallet = useMemo(
    () => wallets.find((w) => w.type === "ethereum"),
    [wallets]
  );

  const activeAddress = wallet?.address || user?.wallet?.address || "";
  const derivedAddress = activeAddress || cachedAddress;
  const isHydrating = !ready || !walletsReady;

  useEffect(() => {
    if (activeAddress) {
      setCachedAddress(activeAddress);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADDRESS_STORAGE_KEY, activeAddress);
      }
    }
  }, [activeAddress]);

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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ADDRESS_STORAGE_KEY);
      }
      setCachedAddress("");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyAddress = async () => {
    const target = derivedAddress;
    if (!target || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      console.warn("Clipboard API not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(target);
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
    const target = derivedAddress;
    if (!target) return;
    const explorerUrl = `https://etherscan.io/address/${target}`;
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  if (isHydrating) {
    if (!derivedAddress) {
      return (
        <Button
          disabled
          variant="outline"
          size="sm"
          className="rounded-lg opacity-60 cursor-not-allowed"
        >
          <div className="h-4 w-4 rounded-full bg-muted animate-spin mr-2" />
          Loading...
        </Button>
      );
    }

    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        className="rounded-lg font-mono text-xs opacity-80"
      >
        {short(derivedAddress)}
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
            Connecting...
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg font-mono text-xs hover:bg-accent/50 transition-all duration-300 group"
        >
          {short(derivedAddress) || "Connected"}
          <ChevronDown className="ml-2 h-3 w-3 transition-transform group-hover:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-lg border-border/50 bg-card/95 backdrop-blur-sm shadow-medium"
      >
        <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border/50">
          Wallet Address
        </div>
        <div className="px-2 py-1.5 font-mono text-xs break-all">
          {derivedAddress || "Connected"}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopyAddress}
          disabled={!derivedAddress}
          className="rounded-md cursor-pointer"
        >
          <Copy className="mr-2 h-3 w-3" />
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleViewOnExplorer}
          disabled={!derivedAddress}
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
              Disconnecting...
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
