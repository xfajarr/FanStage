# Project Architecture Rules (Non-Obvious Only)

- Monorepo structure without workspace management - frontend and backend are separate npm projects
- Frontend uses relaxed TypeScript while backend enforces strict mode - creates type safety inconsistency
- Database schema has complex relational structure between users, campaigns, investments, and artist tokens
- Privy wallet integration hardcoded in main.tsx creates security and configuration inflexibility
- Frontend uses Vite with port 8080, backend uses Hono with port 3000 - API calls must account for CORS
- No testing framework limits ability to implement comprehensive testing strategies
- Database migrations require Drizzle Kit but no migration scripts are visible in package.json
- Frontend uses React Query for state management but no API client setup is visible
- Path alias configuration differs between frontend and backend, affecting module resolution