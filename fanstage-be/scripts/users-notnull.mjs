import { Client } from "pg";

const client = new Client({ connectionString: "postgresql://postgres:jarss1011@localhost:5433/fanstage" });

const query = `
  SELECT attname, attnotnull
  FROM pg_attribute
  WHERE attrelid = 'users'::regclass AND attisdropped = false AND attnum > 0;
`;

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
