const express = require('express');
const router = express.Router();
const db = require('../db/db');
const requireAuth = require('../middleware/authMiddleware');

// health check (ไม่ต้องใช้ JWT)
router.get('/health', (req, res) => {
  res.json({ status: "user-service ok" });
});

// ทุก endpoint หลังจากนี้ต้องใช้ JWT
router.use(requireAuth);

/**
 * GET /api/users/profile
 * ดูโปรไฟล์ของตัวเอง
 */
router.get('/profile', async (req, res) => {
  try {

    const result = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.user.sub]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * PUT /api/users/profile
 * แก้ไขโปรไฟล์ของตัวเอง
 */
router.put('/profile', async (req, res) => {

  const { display_name, bio, avatar_url } = req.body;

  try {

    const result = await db.query(
      `UPDATE user_profiles
       SET display_name = $1,
           bio = $2,
           avatar_url = $3,
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [display_name, bio, avatar_url, req.user.sub]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * GET /api/users
 * admin ดูรายชื่อผู้ใช้ทั้งหมด
 */
router.get('/', async (req, res) => {

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {

    const result = await db.query(
      'SELECT * FROM user_profiles ORDER BY id'
    );

    res.json({
      users: result.rows,
      count: result.rowCount
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * GET /api/users/:id
 * admin ดูโปรไฟล์ user คนอื่น
 */
router.get('/:id', async (req, res) => {

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {

    const result = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.params.id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;