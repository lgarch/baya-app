const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCgIWLEGGa5pfI6N0nJNM8LBk4Q8TbbPHY",
  authDomain: "staymaroc-20741.firebaseapp.com",
  projectId: "staymaroc-20741",
  storageBucket: "staymaroc-20741.firebasestorage.app",
  messagingSenderId: "390727343799",
  appId: "1:390727343799:web:7dbd740a70166c8ce1f732"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GET /api/logements : Récupérer tous les logements
app.get('/api/logements', (req, res) => {
    // Dans l'environnement Vercel Serverless, process.cwd() pointe vers la racine du projet
    const dataPath = path.join(process.cwd(), 'data', 'logements.json');
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
    const dataPath = path.join(process.cwd(), 'data', 'logements.json');
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

// POST /api/reservations : Enregistrer une réservation sur Firebase
app.post('/api/reservations', async (req, res) => {
    try {
        const reservation = req.body;
        reservation.dateDemande = new Date().toISOString();

        // Enregistrer dans Firestore
        const docRef = await addDoc(collection(db, "reservations"), reservation);
        
        res.status(201).json({ 
            message: "Réservation enregistrée avec succès", 
            reservation: { ...reservation, id: docRef.id } 
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement sur Firebase :", error);
        res.status(500).json({ error: "Erreur lors de l'enregistrement de la réservation" });
    }
});

// Exporter l'application pour Vercel
module.exports = app;
