const express  = require('express');
const bcrypt   = require('bcryptjs');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/auth/register — สมัครสมาชิกใหม่
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  // Validate input
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
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, username, email, role`,
      [username, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // ออก JWT
    const token = generateToken({
      sub:   user.id,
      email: user.email,
      role:  user.role,
      username: user.username
    });

    console.log(`[AUTH] Register success: ${email}`);

    res.status(201).json({
      message: 'สมัครสมาชิกสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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
// POST /api/auth/login — เข้าสู่ระบบ
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'กรุณากรอก email และ password'
    });
  }

  try {

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    const dummyHash =
      '$2b$10$invalidhashpadding000000000000000000000000000000000000';

    const passwordHash = user ? user.password_hash : dummyHash;

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!user || !isValid) {
      console.log(`[AUTH] Login failed: ${email}`);
      return res.status(401).json({
        error: 'Email หรือ Password ไม่ถูกต้อง'
      });
    }

    // update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });

    console.log(`[AUTH] Login success: ${email}`);

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

    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Server error' });

  }
});


// ─────────────────────────────────────────────
// GET /api/auth/verify — ตรวจสอบ token
// ─────────────────────────────────────────────
router.get('/verify', (req, res) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      valid: false,
      error: 'No token provided'
    });
  }

  try {

    const decoded = verifyToken(token);

    res.json({
      valid: true,
      user: decoded
    });

  } catch (err) {

    res.status(401).json({
      valid: false,
      error: err.message
    });

  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me — ดูข้อมูล user จาก token
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

  } catch (err) {

    res.status(401).json({
      error: 'Invalid token'
    });

  }

});


// ─────────────────────────────────────────────
// GET /api/auth/health — health check
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    time: new Date()
  });
});

module.exports = router;