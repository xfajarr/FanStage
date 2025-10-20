# FanStage Backend API

A comprehensive backend API for the FanStage platform - a Web3 crowdfunding platform for artists and fans.

## Features

- 🔐 **User Authentication** - Privy wallet integration with JWT tokens
- 👥 **User Management** - Profile management, artist registration
- 🎵 **Campaign Management** - Create, update, and manage funding campaigns
- 💰 **Investment Processing** - Handle campaign investments and profit sharing
- 🪙 **Artist Tokens** - Create and manage artist-specific tokens
- 🎨 **NFT Management** - Investment NFTs and membership passes
- 📊 **Staking System** - Token staking with rewards
- 📝 **Campaign Updates** - Artist updates for campaign backers

## Tech Stack

- **Framework**: Hono.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Privy wallet integration
- **Language**: TypeScript
- **Validation**: Zod schemas

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fanstage-be

# Install dependencies
npm install
# or
pnpm install
```

### Environment Setup

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fanstage

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Blockchain Configuration
PRIVATE_KEY=your-private-key-here
RPC_URL=https://mainnet.infura.io/v3/your-infura-project-id

# IPFS Configuration
IPFS_PROJECT_ID=your-ipfs-project-id
IPFS_PROJECT_SECRET=your-ipfs-project-secret

# Privy Configuration
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
```

### Database Setup

1. Generate database migrations:
```bash
npm run db:generate
```

2. Run migrations:
```bash
npm run db:migrate
```

3. (Optional) Open Drizzle Studio to manage your database:
```bash
npm run db:studio
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Users
- `POST /api/users/login` - Login/register with Privy wallet
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/register-artist` - Register as artist
- `GET /api/users/:walletAddress` - Get user by wallet address

#### Campaigns
- `GET /api/campaigns` - List all campaigns (with filtering)
- `GET /api/campaigns/featured` - Get featured campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create new campaign (artist only)
- `PUT /api/campaigns/:id` - Update campaign (artist only)

#### Investments
- `GET /api/investments/user` - Get user's investment history
- `GET /api/investments/campaign/:id` - Get campaign investments
- `POST /api/investments` - Create investment
- `GET /api/investments/:id` - Get investment details

#### Tokens
- `GET /api/tokens/artist/:artistId` - Get artist token info
- `GET /api/tokens/market` - Get market data for all tokens
- `POST /api/tokens` - Create artist token (artist only)
- `GET /api/tokens/staking/positions` - Get user's staking positions
- `POST /api/tokens/stake` - Stake tokens
- `POST /api/tokens/staking/claim` - Claim staking rewards

#### NFTs
- `GET /api/nfts/user` - Get user's NFT collection
- `GET /api/nfts/campaign/:id` - Get campaign NFTs
- `POST /api/nfts/mint` - Mint investment NFT
- `POST /api/nfts/membership-pass` - Mint membership pass

#### Campaign Updates
- `GET /api/updates/campaign/:id` - Get campaign updates
- `POST /api/updates/campaign/:id` - Create campaign update (artist only)
- `GET /api/updates/:id` - Get single update
- `PUT /api/updates/:id` - Update campaign update (artist only)
- `DELETE /api/updates/:id` - Delete campaign update (artist only)

### Health Check

- `GET /health` - Check API health status

## Database Schema

The application uses the following main tables:

- `users` - User profiles and authentication
- `campaigns` - Funding campaigns
- `investments` - Campaign investments
- `artist_tokens` - Artist-specific tokens
- `membership_passes` - Fan membership NFTs
- `campaign_updates` - Campaign updates from artists

## Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
