import { Client } from "pg";

const client = new Client({ connectionString: "postgresql://postgres:jarss1011@localhost:5433/fanstage" });

const query = "SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position";

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
