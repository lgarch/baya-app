const express = require('express');
const path = require('path');
const app = require('./api/index');

// Servir les fichiers statiques (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname)));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🏠 Baya Apartment est en ligne sur http://localhost:${PORT}`);
});
