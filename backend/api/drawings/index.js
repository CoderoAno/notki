// Backend Azure Functions (api/drawings/index.js)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING
});

module.exports = async function (context, req) {
  if (req.method === 'GET') {
    const res = await pool.query('SELECT * FROM drawings');
    return { jsonBody: res.rows };
  }

  if (req.method === 'POST') {
    await pool.query(
      'INSERT INTO drawings(nick, data) VALUES($1, $2)',
      [req.body.nick, req.body.data]
    );
    return { status: 201 };
  }
};
