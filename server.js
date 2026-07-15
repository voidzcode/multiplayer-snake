const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nPhoton Web SDK is configured with App ID: 2902f049-a0b0-410b-9e8b-c488d223e870`);
  console.log(`All networking is handled by Photon Cloud.`);
});
