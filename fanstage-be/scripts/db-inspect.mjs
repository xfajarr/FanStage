import { Client } from "pg";

const client = new Client({ connectionString: "postgresql://postgres:jarss1011@localhost:5433/fanstage" });

const queries = [
  { name: "users_columns", sql: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position" },
  { name: "users_constraints", sql: "SELECT tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_name = 'users'" },
  { name: "drizzle_migrations", sql: "SELECT name, applied_at FROM __drizzle_migrations ORDER BY id" }
];

(async () => {
  await client.connect();
  for (const { name, sql } of queries) {
    const res = await client.query(sql);
    console.log(`--- ${name} ---`);
    console.table(res.rows);
  }
  await client.end();
})().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
