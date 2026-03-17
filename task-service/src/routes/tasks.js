const express = require('express');
const axios = require('axios');
const { pool } = require('../db/db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'task-service' });
});

// ─────────────────────────────────────────────
// Helper: ส่ง log ไป log-service
// ─────────────────────────────────────────────
async function logEvent(data) {
  try {
    await axios.post('http://log-service:3003/api/logs/internal', {
      service: 'task-service',
      ...data
    });
  } catch (err) {
    console.error('[LOG ERROR]', err.message);
  }
}

// ─────────────────────────────────────────────
// ใช้ JWT middleware ทุก route หลังจากนี้
// ─────────────────────────────────────────────
router.use(requireAuth);

// ─────────────────────────────────────────────
// GET /api/tasks
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT * FROM tasks
        ORDER BY created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT * FROM tasks
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [req.user.sub]);
    }

    res.json({
      tasks: result.rows,
      count: result.rowCount
    });

  } catch (err) {
    console.error('[GET TASKS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/tasks
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, description = '', status = 'TODO', priority = 'medium' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [req.user.sub, title, description, status, priority]
    );

    const task = result.rows[0];

    await logEvent({
      level: 'INFO',
      event: 'TASK_CREATED',
      user_id: req.user.sub,
      method: 'POST',
      path: '/api/tasks',
      status_code: 201,
      message: `Task created: ${title}`,
      meta: { task_id: task.id }
    });

    res.status(201).json({ task });

  } catch (err) {
    console.error('[CREATE TASK ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/tasks/:id
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    const task = check.rows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, status, priority } = req.body;

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, status, priority, id]
    );

    res.json({ task: result.rows[0] });

  } catch (err) {
    console.error('[UPDATE TASK ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/tasks/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );

    const task = check.rows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pool.query(
      'DELETE FROM tasks WHERE id = $1',
      [id]
    );

    await logEvent({
      level: 'INFO',
      event: 'TASK_DELETED',
      user_id: req.user.sub,
      method: 'DELETE',
      path: `/api/tasks/${id}`,
      status_code: 200,
      message: `Task ${id} deleted`
    });

    res.json({ message: 'Task deleted' });

  } catch (err) {
    console.error('[DELETE TASK ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;