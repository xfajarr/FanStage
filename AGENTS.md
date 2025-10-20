# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure

This is a monorepo with two main applications:
- `fanstage-fe/` - React frontend with Vite
- `fanstage-be/` - Hono backend with TypeScript

## Build Commands

### Frontend (fanstage-fe/)
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (fanstage-be/)
- `npm run dev` - Start development server with tsx watch
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

## Database

The backend uses Drizzle ORM with PostgreSQL. Schema is defined in `fanstage-be/src/db/schema.ts` with relations for users, campaigns, investments, and artist tokens.

## Key Patterns

### Frontend
- Uses shadcn/ui components with custom configuration
- Path aliases: `@/` points to `src/`
- Wallet connection via Privy with multiple login methods
- React Query for state management
- React Router for navigation

### Backend
- Hono framework for REST API
- Drizzle ORM for database operations
- TypeScript with strict mode enabled
- ES modules with `"type": "module"`

## Code Style

### TypeScript Configuration
- Frontend: Relaxed strictness (`noImplicitAny: false`, `strictNullChecks: false`)
- Backend: Strict mode enabled
- Both use path resolution and modern ES features

### Component Structure
- UI components follow shadcn/ui patterns
- Custom components use Radix UI primitives
- Consistent use of `cn()` utility for className merging

## Environment

Frontend uses Vite environment variables with `VITE_` prefix. Backend uses standard Node.js environment variables.

## Testing

No testing framework is currently configured in this project.

## Development Notes

- Frontend runs on port 8080, backend on port 3000
- Both applications use TypeScript but with different strictness levels
- Database schema includes comprehensive relations for fan-artist platform
- Privy app ID is hardcoded in main.tsx (should be moved to environment)

## Backend API Requirements

Based on frontend analysis, the backend needs to provide the following endpoints and data:

### User Management
- `GET /api/users/profile` - Get current user profile
- `POST /api/users/register` - Register new user
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/register-artist` - Artist registration application

### Campaigns
- `GET /api/campaigns` - List all campaigns (with filtering by category, status, search)
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create new campaign (artist only)
- `PUT /api/campaigns/:id` - Update campaign (artist only)
- `GET /api/campaigns/featured` - Get featured campaigns for homepage

### Investments
- `POST /api/investments` - Invest in campaign
- `GET /api/investments/user` - Get user's investment history
- `GET /api/investments/campaign/:id` - Get campaign investments

### Artist Tokens
- `GET /api/tokens/artist/:artistId` - Get artist token info
- `GET /api/tokens/market` - Get market data for all tokens
- `POST /api/tokens/stake` - Stake tokens
- `GET /api/tokens/staking/positions` - Get user's staking positions
- `POST /api/tokens/staking/claim` - Claim staking rewards

### NFTs
- `GET /api/nfts/user` - Get user's NFT collection
- `GET /api/nfts/campaign/:id` - Get campaign NFTs
- `POST /api/nfts/mint` - Mint investment NFT

### Campaign Updates
- `GET /api/campaigns/:id/updates` - Get campaign updates
- `POST /api/campaigns/:id/updates` - Create campaign update (artist only)

### Data Models Required
- User: walletAddress, role, username, bio, profileImage, socialMediaLinks
- Campaign: artistId, title, description, category, fundingGoal, currentFunding, profitShare, rewards, deadlines
- Investment: campaignId, investorId, amount, transactionHash, profitShare, payoutStatus
- ArtistToken: artistId, tokenName, tokenSymbol, tokenAddress, market data
- NFT: tokenId, name, description, image, type, artistId, campaignId, benefits
- StakingPosition: artistId, tokenSymbol, stakedAmount, apy, earnedYield