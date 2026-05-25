// Primary index server generated autonomously
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to express-app!', initialized: true, autonomyLevel: 'Swarm' });
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});