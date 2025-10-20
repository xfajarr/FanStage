# Project Documentation Rules (Non-Obvious Only)

- Frontend and backend have different TypeScript strictness levels - frontend is relaxed, backend is strict
- Privy wallet integration uses hardcoded app ID in main.tsx instead of environment variables
- Database schema includes comprehensive relations for fan-artist platform with complex relationships
- Frontend uses shadcn/ui components with custom configuration and Radix UI primitives
- Path aliases differ between frontend (`@/` points to `src/`) and backend
- Project uses monorepo structure but no workspace management tool (like npm workspaces)
- No testing framework configured - documentation should mention manual testing approaches
- Environment variable patterns differ between frontend (VITE_ prefix) and backend (standard)
- Database migrations require Drizzle Kit but commands aren't in package.json scripts