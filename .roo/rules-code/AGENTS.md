# Project Coding Rules (Non-Obvious Only)

- Frontend TypeScript uses relaxed strictness (`noImplicitAny: false`, `strictNullChecks: false`) - don't assume strict typing
- Backend TypeScript enforces strict mode - always use proper typing
- Database schema uses Drizzle ORM with comprehensive relations - always check schema.ts for table relationships
- Privy app ID is hardcoded in main.tsx - should use environment variables instead
- Use `cn()` utility from `@/lib/utils` for className merging in components
- Path aliases: `@/` points to `src/` in frontend
- Backend uses ES modules (`"type": "module"`) - use import/export syntax
- Frontend runs on port 8080, backend on port 3000 - remember for API calls
- No testing framework configured - add tests before implementing complex features
- Database uses PostgreSQL with Drizzle ORM - use the defined schema relations