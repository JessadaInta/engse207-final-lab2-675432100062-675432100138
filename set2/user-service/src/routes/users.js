const express = require('express');
const router = express.Router();
const db = require('../db/db');

// create profile
router.post('/profile', async (req, res) => {
  try {

    const {
      user_id,
      username,
      email,
      display_name,
      bio,
      avatar_url
    } = req.body;

    const result = await db.query(
      `INSERT INTO user_profiles 
      (user_id, username, email, display_name, bio, avatar_url)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [user_id, username, email, display_name, bio, avatar_url]
    );

    res.json({
      message: "Profile created",
      profile: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get profile
router.get('/profile/:id', async (req, res) => {
  try {

    const id = req.params.id;

    const result = await db.query(
      'SELECT * FROM user_profiles WHERE user_id=$1',
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update profile
router.put('/profile/:id', async (req, res) => {
  try {

    const id = req.params.id;
    const { display_name, bio, avatar_url } = req.body;

    const result = await db.query(
      `UPDATE user_profiles
       SET display_name=$1,
           bio=$2,
           avatar_url=$3,
           updated_at=NOW()
       WHERE user_id=$4
       RETURNING *`,
      [display_name, bio, avatar_url, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;