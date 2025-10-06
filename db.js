const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                   "postgres://secondmindbbdd_user:2gxWp3U52NaAN2ffInp1NA9QJaMXvKlx@dpg-d30par8gjchc73f4pf20-a.oregon-postgres.render.com:5432/secondmindbbdd",
  ssl: { rejectUnauthorized: false } 
});

module.exports = pool;