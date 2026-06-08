const { Client } = require("pg");

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

(async () => {
    await client.connect();
    const res = await client.query("select version()");
    console.log(res.rows);
    await client.end();
})();