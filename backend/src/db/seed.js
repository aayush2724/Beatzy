require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./client');

async function seed() {
  const email = 'admin@beatzy.app';
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows[0]) {
      console.log('Admin user already exists. Setting is_admin to true...');
      await pool.query('UPDATE users SET is_admin = true, plan = \'enterprise\', is_active = true WHERE email = $1', [email]);
      console.log('Admin user updated successfully.');
      return;
    }

    console.log('Seeding admin user...');
    const id = uuidv4();
    const passwordHash = await bcrypt.hash('password123', 12);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, plan, is_active, is_admin)
       VALUES ($1, $2, $3, $4, 'enterprise', true, true)`,
      [id, 'Beatzy Operator', email, passwordHash]
    );
    console.log('Admin user seeded successfully with email: admin@beatzy.app, password: password123');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
