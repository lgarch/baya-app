const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Endpoints API

// GET /api/logements : Récupérer tous les logements
app.get('/api/logements', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'logements.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur de lecture du fichier logements.json", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(JSON.parse(data));
    });
});

// GET /api/logements/:id : Récupérer un logement spécifique
app.get('/api/logements/:id', (req, res) => {
    const dataPath = path.join(__dirname, 'data', 'logements.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Erreur serveur" });
        }
        const logements = JSON.parse(data);
        const logement = logements.find(l => l.id === req.params.id);
        if (logement) {
            res.json(logement);
        } else {
            res.status(404).json({ error: "Logement non trouvé" });
        }
    });
});

// POST /api/reservations : Enregistrer une réservation
app.post('/api/reservations', (req, res) => {
    const reservation = req.body;
    reservation.dateDemande = new Date().toISOString();

    const dataPath = path.join(__dirname, 'data', 'reservations.json');
    
    // Lire le fichier actuel, ajouter la réservation et sauvegarder
    fs.readFile(dataPath, 'utf8', (err, data) => {
        let reservations = [];
        if (!err && data) {
            try {
                reservations = JSON.parse(data);
            } catch (e) {
                console.error("Fichier reservations.json corrompu, création d'un nouveau.");
            }
        }
        
        reservations.push(reservation);
        
        fs.writeFile(dataPath, JSON.stringify(reservations, null, 2), (err) => {
            if (err) {
                console.error("Erreur d'écriture de la réservation", err);
                return res.status(500).json({ error: "Erreur lors de l'enregistrement de la réservation" });
            }
            res.status(201).json({ message: "Réservation enregistrée avec succès", reservation });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Dossier statique servi : ${__dirname}`);
});
