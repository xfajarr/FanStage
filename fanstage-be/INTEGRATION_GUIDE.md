# FanStage Integration Guide

This document describes how the **FanStage** frontend and backend fit together, how to call every API route from the React application, and how to wire blockchain (smart contract) activity into the Node/Hono backend.

The guide assumes you have read `fanstage-be/README.md` for local setup. Everything below focuses on wiring features together once both apps are running.

---

## 1. Architecture At A Glance
- **Frontend (`fanstage-fe/`)**  
  Vite + React + TypeScript. UI is currently driven by mock data and placeholder providers—replace those stubs with live API calls described below.
- **Backend (`fanstage-be/`)**  
  Hono HTTP API (ESM) with Drizzle ORM + PostgreSQL. Uses JWT auth issued by the `/api/users/login` route, with optional Privy + wallet metadata.
- **Blockchain**  
  No on-chain integration is wired yet, but the backend exposes configuration hooks (`RPC_URL`, `PRIVATE_KEY`) so it can listen for contract events or submit transactions when you add an `ethers.js`/`viem` client.

Frontends should treat the backend as the *single source of truth* for campaign, investment, NFT, and staking data. The backend, in turn, should reflect on-chain state by indexing events or verifying transaction hashes.

---

## 2. Environment & Shared Conventions

### Backend
- Base URL: `http://localhost:3000/api`
- Required env vars (see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, `RPC_URL`, `PRIVATE_KEY`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET`.
- Auth header: `Authorization: Bearer <jwt>` for any route guarded by `authMiddleware` (see table below).

### Frontend
Create `fanstage-fe/.env` (Vite uses `VITE_` prefix):

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PRIVY_APP_ID=your-privy-app-id
```

You'll typically wrap calls in a small client:

```ts
// src/lib/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('fanstage_jwt');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
```

Pair the helper with React Query/SWR hooks that mirror each backend resource.

### Pagination & Filtering
- Every collection route accepts `page` and `limit` query params (default `1` / `10`) and returns a `pagination` object.
- Campaign listing also accepts `category`, `status`, `search`.

---

## 3. Endpoint Reference & Frontend Usage

Legend:  
• **Auth** means JWT required.  
• Example calls assume the helper above.  
• Response payloads below mirror the Drizzle select shape; mock values (e.g., token market data) are marked with ⚠️ so you know what to replace later.

### 3.1 Users (`/api/users`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/login` | ✖️ | Create or fetch a user via wallet + Privy metadata. Returns JWT. |
| GET | `/profile` | ✔️ | Fetch authenticated profile. |
| PUT | `/profile` | ✔️ | Update profile (username, bio, etc.). |
| POST | `/register-artist` | ✔️ | Upgrade fan → artist (`artistCategory` etc.). |
| GET | `/:walletAddress` | ✖️ | Public lookup by wallet. |

**Frontend flow**
```ts
// Login after Privy returns wallet + user info
const { token, user } = await apiFetch<{ token: string; user: UserDto }>('/users/login', {
  method: 'POST',
  body: JSON.stringify({ walletAddress, username, email }),
});
localStorage.setItem('fanstage_jwt', token);
```

### 3.2 Campaigns (`/api/campaigns`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | ✖️ | Supports `category`, `status`, `search`, pagination. |
| GET | `/featured` | ✖️ | Top 6 ongoing campaigns ordered by current funding. |
| GET | `/:id` | ✖️ | Full campaign detail (profit share object, artist info). |
| POST | `/` | ✔️ Artist | Validated via `campaignSchema`; requires artist token to exist. |
| PUT | `/:id` | ✔️ Artist | Only owner may update. |

Response snippet (`GET /api/campaigns`):
```jsonc
{
  "campaigns": [
    {
      "id": 1,
      "artistId": "0x123...",
      "artistName": "Luna Rivers",
      "artistAvatar": "https://...",
      "title": "Debut Album",
      "description": "...",
      "category": "album",             // hard-coded until schema adds column
      "fundingGoal": "50000",
      "currentFunding": "12500",
      "backerCount": 42,
      "startDate": "2025-03-01T12:00:00.000Z",
      "endDate": "2025-04-30T12:00:00.000Z",
      "profitShare": { "fan": 30, "artist": 70 },
      "status": "ongoing"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

**Frontend usage (React Query example)**
```ts
export function useCampaigns(params: CampaignQuery = {}) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => apiFetch<PaginatedResponse<CampaignSummary>>(
      `/campaigns?${new URLSearchParams(params as Record<string, string>)}`
    ),
  });
}
```

### 3.3 Investments (`/api/investments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/user` | ✔️ | Investment history for current wallet. |
| GET | `/campaign/:id` | ✖️ | Leaderboard of investments in a campaign. |
| POST | `/` | ✔️ | Persist an investment after on-chain transaction settles. |
| GET | `/:id` | ✔️ | Single investment (ensures ownership). |

`POST /api/investments` requires:
```json
{
  "campaignId": 1,
  "investedAmountToken": "250",    // string; schema converts to number internally
  "transactionHash": "0xabc...def",
  "nftTokenId": 12345
}
```

Backend validates:
- Campaign exists and is `ongoing`.
- Deadline not passed.
- Transaction hash unique (to avoid replay).

⚠️ `artistName` in response is currently empty; fetch by ID on the client if needed until backend joins user info in the insert handler.

### 3.4 NFTs (`/api/nfts`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/user` | ✔️ | Membership passes + investment NFTs merged and sorted. |
| GET | `/campaign/:id` | ✖️ | Campaign-specific investment NFTs. |
| POST | `/mint` | ✔️ | Placeholder success response for mint flow. |
| POST | `/membership-pass` | ✔️ | Create a membership pass record after on-chain mint. |

Membership pass validation now demands `artistId`, `passTier`, `nftTokenId`, `mintTransactionHash`. Ensure the frontend sends all four.

### 3.5 Tokens (`/api/tokens`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/artist/:artistId` | ✖️ | Token metadata + ⚠️ mock market stats. |
| GET | `/market` | ✖️ | All tokens with ⚠️ mock market stats. |
| POST | `/` | ✔️ Artist | Register artist token (once per artist). |
| GET | `/staking/positions` | ✔️ | ⚠️ Mock staking positions. |
| POST | `/stake` | ✔️ | ⚠️ Mock staking result. |
| POST | `/staking/claim` | ✔️ | ⚠️ Mock staking claim. |

Replace mock market/staking data with real on-chain queries once the contract ABI is available (see section 4).

### 3.6 Campaign Updates (`/api/updates`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/campaign/:id` | ✖️ | Paginated updates for a campaign. |
| POST | `/campaign/:id` | ✔️ Artist | Create update (campaign ownership enforced). |
| GET | `/:id` | ✖️ | Single update. |
| PUT | `/:id` | ✔️ Artist | Edit update (ownership enforced). |
| DELETE | `/:id` | ✔️ Artist | Delete update (ownership enforced). |

---

## 4. Smart Contract Integration (Backend)

The backend is the right place to verify and persist blockchain activity. Suggested architecture:

1. **HTTP Triggered Path (already available)**  
   - User signs and submits a transaction from the frontend (e.g., investment).  
   - After the wallet returns a tx hash, the frontend calls the corresponding API route (`POST /api/investments`, `/api/nfts/membership-pass`, etc.) with the hash and relevant IDs.  
   - Backend can optionally verify the tx on-chain before writing to the database (see code sample below).

2. **Background Indexer / Listener**  
   - Spin up an `ethers`/`viem` provider using `RPC_URL`.  
   - Attach listeners to contract events (e.g., `InvestmentRecorded`, `MembershipPassMinted`).  
   - On event, upsert database rows so the REST API is always in sync even if the frontend never called the HTTP endpoint (good for resilience).

### Example: Verifying a Transaction Before Insert

```ts
// fanstage-be/src/services/chain.ts
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { abi } from './abi/investmentManager.js';

const RPC_URL = process.env.RPC_URL!;
const CONTRACT_ADDRESS = process.env.INVESTMENT_MANAGER_ADDRESS!;

const client = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });

export async function validateInvestmentTx(txHash: `0x${string}`, expectedCampaignId: number) {
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') throw new Error('Transaction not successful on-chain');

  const logs = receipt.logs.filter((log) => log.address === CONTRACT_ADDRESS);
  const decoded = logs
    .map((log) => client.decodeEventLog({ abi, data: log.data, topics: log.topics }))
    .find((event) => event.eventName === 'InvestmentRecorded');

  if (!decoded) throw new Error('InvestmentRecorded event missing');
  const { campaignId } = decoded.args;
  if (Number(campaignId) !== expectedCampaignId) throw new Error('Campaign mismatch');
}
```

Then call `validateInvestmentTx` inside the POST `/api/investments` handler before inserting. Adjust for your ABI.

### Example: Event Listener (Long-Running Worker)

```ts
// fanstage-be/src/workers/investmentListener.ts
import { createPublicClient, webSocket } from 'viem';
import { abi } from '../services/abi/investmentManager.js';
import { db, investments } from '../db/index.js';

const client = createPublicClient({
  transport: webSocket(process.env.RPC_URL!),
  chain: /* your chain */,
});

client.watchEvent({
  address: process.env.INVESTMENT_MANAGER_ADDRESS as `0x${string}`,
  abi,
  eventName: 'InvestmentRecorded',
  onLogs: async (logs) => {
    for (const log of logs) {
      await db.insert(investments).values({
        campaignId: Number(log.args.campaignId),
        investorId: log.args.investor,
        transactionHash: log.transactionHash,
        investedAmountToken: log.args.amount.toString(),
        nftTokenId: Number(log.args.nftId),
      }).onConflictDoNothing();
    }
  },
});
```

Run the worker alongside the main API (PM2, Docker Compose, etc.).

### Submitting Transactions From Backend
If the backend needs to initiate blockchain actions (e.g., distribute payouts):
1. Instantiate a signer with the backend private key.
2. Guard routes so only artists/admins can trigger the action.
3. Store resulting tx hash and track status via polling/event listeners.

```ts
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: mainnet, transport: http(RPC_URL!) });

export function distributePayout(campaignId: number, amount: bigint) {
  return walletClient.writeContract({
    address: process.env.PAYOUT_MANAGER_ADDRESS as `0x${string}`,
    abi: payoutAbi,
    functionName: 'distribute',
    args: [campaignId, amount],
  });
}
```

---

## 5. Frontend Migration Plan (Mock → Live Data)

1. **Centralize API Calls**  
   - Create `src/lib/apiClient.ts` (sample above).  
   - Define DTO types that mirror backend responses for safer UI rendering.

2. **Replace Mock Data Gradually**  
   - `mockCampaigns` → `useCampaigns` hook calling `/api/campaigns`.  
   - Create `useFeaturedCampaigns`, `useCampaign(id)`, etc.
   - For membership NFTs, replace front mock arrays with `/api/nfts/user`.

3. **Auth Flow**  
   - Use the existing `PrivyProvider` stub to initialize Privy.  
   - On login success, call `/api/users/login`, persist JWT (`localStorage` or `Privy` session), hydrate React Query caches.

4. **Error Handling & Loading States**  
   - Wrap fetches with React Query to leverage caching and built-in loading skeleton states.
   - When the backend returns validation errors (400), show toast notifications using shadcn/ui `useToast`.

5. **Real-Time Updates (Optional)**  
   - After blockchain listener writes to DB, add a small `/events` SSE or poll strategy if you need instant UI updates (e.g., use React Query refetch on interval or WebSocket).

---

## 6. Checklist & Next Steps
1. **Configure Environment**  
   - Backend `.env` with DB + blockchain vars.  
   - Frontend `.env` with `VITE_API_BASE_URL`.
2. **Implement Auth Runtime**  
   - Connect Privy (frontend) → `/api/users/login`.
3. **Swap Mock Stores for Queries**  
   - Campaigns, investments, NFTs, tokens.
4. **Smart Contract Wiring**  
   - Add `viem`/`ethers` service, validate transaction hashes, start event listeners.
5. **Replace Mock Market/Staking Data**  
   - Query on-chain supply, price, holders; connect to staking contract.
6. **Testing**  
   - Add integration tests (e.g., using `vitest` + supertest) to validate endpoints once flows are live.

By following this guide, the frontend will progressively migrate to real data, and the backend will maintain a trustworthy mirror of smart contract state while handling authentication, persistence, and validation responsibilities.

