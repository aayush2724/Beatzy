require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./client');

// Admin credentials come from the environment so no default password ever
// ships in the repo. Run with:
//   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='...' npm run seed
const email = (process.env.SEED_ADMIN_EMAIL || '').trim();
const password = process.env.SEED_ADMIN_PASSWORD || '';
const name = (process.env.SEED_ADMIN_NAME || 'Beatzy Operator').trim();

function abort(reason) {
  console.error(`Seed aborted: ${reason}`);
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) abort('SEED_ADMIN_EMAIL must be set to a valid email address');
if (password.length < 12) abort('SEED_ADMIN_PASSWORD must be set and at least 12 characters long');

async function seed() {
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      console.log(`User ${email} already exists — granting admin and the enterprise plan (password left unchanged).`);
      await pool.query(
        "UPDATE users SET is_admin = true, plan = 'enterprise', is_active = true WHERE email = $1",
        [email]
      );
      console.log('Admin user updated successfully.');
      return;
    }

    console.log(`Seeding admin user ${email}...`);
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, plan, is_active, is_admin)
       VALUES ($1, $2, $3, $4, 'enterprise', true, true)`,
      [uuidv4(), name, email, passwordHash]
    );
    console.log(`Admin user seeded successfully: ${email}`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
