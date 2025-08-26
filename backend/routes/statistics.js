const express = require('express');
const { db } = require('../database/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET - Benutzer-Statistiken
router.get('/user/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    
    // Prüfen ob Benutzer seine eigenen Statistiken oder Admin ist
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const query = `
        SELECT us.*, u.name, u.email 
        FROM user_statistics us 
        LEFT JOIN users u ON us.user_id = u.id 
        WHERE us.user_id = ?
    `;

    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        if (!row) {
            // Erstelle Standard-Statistiken wenn noch nicht vorhanden
            const defaultStats = {
                user_id: userId,
                reports: 0,
                points: 0,
                searches: 0,
                favorites: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            return res.json(defaultStats);
        }

        res.json(row);
    });
});

// GET - Top 10 Rangliste (öffentlich)
router.get('/leaderboard', (req, res) => {
    const query = `
        SELECT us.points, us.reports, u.name, u.id,
               ROW_NUMBER() OVER (ORDER BY us.points DESC) as rank
        FROM user_statistics us 
        LEFT JOIN users u ON us.user_id = u.id 
        WHERE us.points > 0
        ORDER BY us.points DESC 
        LIMIT 10
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        res.json(rows);
    });
});

// GET - Position eines Benutzers in der Rangliste
router.get('/user/:userId/position', verifyToken, (req, res) => {
    const userId = req.params.userId;
    
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const query = `
        SELECT rank FROM (
            SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC) as rank
            FROM user_statistics 
            WHERE points > 0
        ) ranked 
        WHERE user_id = ?
    `;

    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        res.json({ position: row ? row.rank : 'Nicht in Top 100' });
    });
});

// PUT - Statistiken aktualisieren
router.put('/user/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const { reports, points, searches, favorites } = req.body;
    
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    const query = `
        INSERT OR REPLACE INTO user_statistics 
        (user_id, reports, points, searches, favorites, updated_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;

    db.run(query, [userId, reports || 0, points || 0, searches || 0, favorites || 0], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        res.json({ message: 'Statistiken aktualisiert' });
    });
});

// POST - Statistiken erhöhen (z.B. für Suchen)
router.post('/user/:userId/increment', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const { field, amount = 1 } = req.body;
    
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    if (!['reports', 'points', 'searches', 'favorites'].includes(field)) {
        return res.status(400).json({ message: 'Ungültiges Feld' });
    }

    const query = `
        INSERT OR REPLACE INTO user_statistics (user_id, ${field}, updated_at) 
        VALUES (?, 
            COALESCE((SELECT ${field} FROM user_statistics WHERE user_id = ?), 0) + ?,
            datetime('now')
        )
    `;

    db.run(query, [userId, userId, amount], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        res.json({ message: `${field} erhöht` });
    });
});

module.exports = router;
