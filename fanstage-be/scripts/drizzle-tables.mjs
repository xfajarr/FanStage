import { Client } from "pg";

const client = new Client({ connectionString: "postgresql://postgres:jarss1011@localhost:5433/fanstage" });

const query = "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '__drizzle_migrations%'";

const run = async () => {
  await client.connect();
  const res = await client.query(query);
  console.table(res.rows);
  await client.end();
};

run().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
