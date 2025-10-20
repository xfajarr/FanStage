import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:jarss1011@localhost:5433/fanstage" });
const query = "SELECT * FROM drizzle.__drizzle_migrations";
(async () => {
  await client.connect();
  const res = await client.query(query);
  console.log(res.rows);
  await client.end();
})().catch(async (err) => { console.error(err); await client.end(); process.exit(1); });
