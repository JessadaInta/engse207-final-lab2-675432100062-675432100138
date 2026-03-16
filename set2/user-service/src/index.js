const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/users');

app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: "user-service ok" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});