const express = require('express');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();


router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {

  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      error: 'กรุณากรอก email, password และ username'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร'
    });
  }

  try {

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1,$2,$3,'member')
       RETURNING id,username,email,role`,
      [username, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // 🔥 CALL USER SERVICE
    try {

      await axios.post(
        'http://user-service:3003/api/users',
        {
          user_id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      );

      console.log('[AUTH] Profile created in user-service');

    } catch (err) {

      console.error('[AUTH] user-service error:', err.message);

    }

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user
    });

  } catch (err) {

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Email หรือ Username นี้ถูกใช้แล้ว'
      });
    }

    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ error: 'Server error' });

  }

});


// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'กรุณากรอก email และ password'
    });
  }

  try {

    console.log('[LOGIN] INPUT:', email, password);

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    const user = result.rows[0];

    console.log('[LOGIN] USER:', user);

    if (!user) {
      return res.status(401).json({
        error: 'Email หรือ Password ไม่ถูกต้อง'
      });
    }

    console.log('[LOGIN] HASH FROM DB:', user.password_hash);

    const isValid = await bcrypt.compare(
      String(password),
      String(user.password_hash)
    );

    console.log('[LOGIN] COMPARE RESULT:', isValid);

    if (!isValid) {
      return res.status(401).json({
        error: 'Email หรือ Password ไม่ถูกต้อง'
      });
    }

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id=$1',
      [user.id]
    );

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });

    res.json({
      message: 'Login สำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ message: err.message });
  }

});


// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
router.get('/me', (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  try {

    const decoded = verifyToken(token);

    res.json({
      user: decoded
    });

  } catch {

    res.status(401).json({
      error: 'Invalid token'
    });

  }

});

module.exports = router;