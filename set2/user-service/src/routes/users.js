const express = require('express');
const { pool } = require('../db/db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// health check (ไม่ต้องใช้ JWT เพื่อให้ Docker healthcheck ใช้ได้)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});


/**
 * GET /api/users/me
 * ดูโปรไฟล์ตัวเอง
 */
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


/**
 * PUT /api/users/me
 * แก้ไขโปรไฟล์ตัวเอง
 */
router.put('/me', requireAuth, async (req, res) => {

  const { display_name, bio, avatar_url } = req.body;

  try {

    const result = await pool.query(
      `UPDATE user_profiles
       SET display_name = $1,
           bio = $2,
           avatar_url = $3,
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [display_name, bio, avatar_url, req.user.sub]
    );

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error('[USER] update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * GET /api/users
 * admin ดูรายชื่อผู้ใช้ทั้งหมด
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT id, user_id, username, email, role, created_at FROM user_profiles ORDER BY id'
    );

    res.json({
      users: result.rows,
      total: result.rowCount
    });

  } catch (err) {
    console.error('[USER] list error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;