const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING
});

module.exports = async function (context, req) {
  try {
    if (req.method === 'GET') {
      const res = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
      context.res = {
        status: 200,
        body: res.rows
      };
    } else if (req.method === 'POST') {
      await pool.query(
        'INSERT INTO messages(nick, text) VALUES($1, $2)',
        [req.body.nick, req.body.text]
      );
      context.res = { status: 201 };
    }
  } catch (err) {
    context.res = {
      status: 500,
      body: err.message
    };
  }
};