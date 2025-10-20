# Project Debug Rules (Non-Obvious Only)

- Frontend development server runs on port 8080, backend on port 3000
- Privy app ID is hardcoded in main.tsx - check this if wallet connection fails
- Database schema relations are complex - check Drizzle ORM relations in schema.ts
- Frontend uses relaxed TypeScript - expect implicit any types
- Backend uses strict TypeScript - type errors will be more strict
- No testing framework configured - manual testing required
- Environment variables: frontend uses VITE_ prefix, backend uses standard NODE_ENV
- ESLint rule "@typescript-eslint/no-unused-vars" is disabled in frontend
- Database migrations require Drizzle Kit commands (not visible in package.json)