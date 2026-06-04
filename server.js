const express = require('express');
const path = require('path');

const app = express();

const version = process.env.VERSION || 'v1';

app.use(express.static(path.join(__dirname, 'public', version)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', version, 'index.html'));
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Serving version: ${version}`);
});