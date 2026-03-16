const express = require('express');
const { pool } = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// health check (ไม่ต้องใช้ JWT เพื่อให้ Docker healthcheck ใช้ได้)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// เพิ่ม create profile
router.post('/', async (req, res) => {

  const { user_id, username, email, role } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO user_profiles (user_id,username,email,role)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [user_id, username, email, role]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'profile exists'
      });
    }

    console.error('[USER] create profile error:', err.message);

    res.status(500).json({
      error: 'Server error'
    });

  }

});

// GET /api/users/me — ดูโปรไฟล์ตัวเอง (ต้อง login)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.user.sub]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล profile' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[USER] /me error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users  (internal use จาก auth-service)
router.post('/', async (req, res) => {
  const { user_id, username, email, role } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO user_profiles (user_id, username, email, role)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [user_id, username, email, role]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    if (err.code === '23505') {
      return res.status(409).json({ error: 'profile exists' });
    }

    console.error('[USER] create profile error:', err.message);
    res.status(500).json({ error: 'Server error' });

  }
});

// PUT /api/users/me — แก้ไขโปรไฟล์ตัวเอง (ต้อง login)
router.put('/me', requireAuth, async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.sub;

  try {
    const result = await pool.query(
      `UPDATE user_profiles
 SET username = COALESCE($1, username),
     email = COALESCE($2, email)
 WHERE user_id = $3
 RETURNING id, user_id, username, email, role, updated_at`,
      [username, email, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล profile' });
    }

    res.json({
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: result.rows[0]
    });

  } catch (err) {
    console.error('[USER] update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users — ดู users ทั้งหมด (admin only)
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, username, email, role, updated_at FROM user_profiles ORDER BY updated_at DESC'
    );
    res.json({ users: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

module.exports = router;