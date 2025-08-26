const express = require('express');
const { db } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET - Alle gemeldeten Parkplätze (öffentlich)
router.get('/', (req, res) => {
    const query = `
        SELECT rp.*, u.name as reporter_name 
        FROM reported_parking_spots rp 
        LEFT JOIN users u ON rp.user_id = u.id 
        WHERE rp.status = 'approved' 
        ORDER BY rp.rating_score DESC, rp.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Laden der gemeldeten Parkplätze:', err);
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        res.json(rows);
    });
});

// POST - Neuen Parkplatz melden
router.post('/', authenticateToken, (req, res) => {
    const { 
        address, 
        description, 
        spaces, 
        type, 
        disc_duration, 
        restriction_start, 
        restriction_end, 
        restriction_days, 
        latitude, 
        longitude 
    } = req.body;
    const userId = req.user.id;

    if (!address || !latitude || !longitude || !type) {
        return res.status(400).json({ message: 'Adresse, Koordinaten und Typ sind erforderlich' });
    }

    const query = `
        INSERT INTO reported_parking_spots 
        (user_id, address, description, spaces, type, disc_duration, restriction_start, restriction_end, restriction_days, latitude, longitude, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `;

    db.run(query, [
        userId, 
        address, 
        description, 
        spaces, 
        type, 
        disc_duration, 
        restriction_start, 
        restriction_end, 
        restriction_days, 
        latitude, 
        longitude
    ], function(err) {
        if (err) {
            console.error('Fehler beim Speichern des Parkplatzes:', err);
            return res.status(500).json({ message: 'Fehler beim Speichern' });
        }

        const parkingId = this.lastID;

        // Statistiken aktualisieren
        const statsQuery = `
            INSERT OR REPLACE INTO user_statistics (user_id, reports, points, updated_at) 
            VALUES (?, 
                COALESCE((SELECT reports FROM user_statistics WHERE user_id = ?), 0) + 1,
                COALESCE((SELECT points FROM user_statistics WHERE user_id = ?), 0) + 10,
                datetime('now')
            )
        `;

        db.run(statsQuery, [userId, userId, userId], function(err) {
            if (err) {
                console.error('Fehler beim Aktualisieren der Statistiken:', err);
            }
        });

        res.status(201).json({ 
            message: 'Parkplatz erfolgreich gemeldet! +10 Punkte erhalten.',
            parkingId: parkingId,
            points: 10
        });
    });
});

// POST - Parkplatz bewerten
router.post('/:id/rate', authenticateToken, (req, res) => {
    const { rating_type, comment } = req.body;
    const parkingId = req.params.id;
    const userId = req.user.id;

    if (!rating_type || !['confirm', 'unavailable', 'report'].includes(rating_type)) {
        return res.status(400).json({ message: 'Ungültiger Bewertungstyp' });
    }

    // Bewertung speichern
    const ratingQuery = `
        INSERT OR REPLACE INTO parking_ratings 
        (parking_spot_id, user_id, rating_type, comment, created_at) 
        VALUES (?, ?, ?, ?, datetime('now'))
    `;

    db.run(ratingQuery, [parkingId, userId, rating_type, comment], function(err) {
        if (err) {
            console.error('Fehler beim Speichern der Bewertung:', err);
            return res.status(500).json({ message: 'Fehler beim Speichern der Bewertung' });
        }

        // Parkplatz-Statistiken aktualisieren
        const updateQuery = `
            UPDATE reported_parking_spots 
            SET rating_count = (
                SELECT COUNT(*) FROM parking_ratings WHERE parking_spot_id = ?
            ),
            rating_score = (
                SELECT AVG(CASE 
                    WHEN rating_type = 'confirm' THEN 1.0
                    WHEN rating_type = 'unavailable' THEN 0.0
                    WHEN rating_type = 'report' THEN 0.5
                END) FROM parking_ratings WHERE parking_spot_id = ?
            ),
            last_confirmed = CASE 
                WHEN ? = 'confirm' THEN datetime('now')
                ELSE last_confirmed
            END,
            updated_at = datetime('now')
            WHERE id = ?
        `;

        db.run(updateQuery, [parkingId, parkingId, rating_type, parkingId], function(err) {
            if (err) {
                console.error('Fehler beim Aktualisieren der Parkplatz-Statistiken:', err);
            }
        });

        res.json({ 
            message: 'Bewertung erfolgreich gespeichert',
            rating_type: rating_type
        });
    });
});

// PUT - Parkplatz-Status ändern (nur Admin)
router.put('/:id/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Nur Administratoren können den Status ändern' });
    }

    const { status } = req.body;
    const parkingId = req.params.id;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Ungültiger Status' });
    }

    const query = 'UPDATE reported_parking_spots SET status = ? WHERE id = ?';
    
    db.run(query, [status, parkingId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        res.json({ message: 'Status erfolgreich aktualisiert' });
    });
});

// DELETE - Parkplatz löschen (nur Admin oder eigener Parkplatz)
router.delete('/:id', authenticateToken, (req, res) => {
    const parkingId = req.params.id;
    const userId = req.user.id;

    // Prüfen ob Benutzer Admin ist oder der Parkplatz ihm gehört
    const checkQuery = 'SELECT user_id FROM reported_parking_spots WHERE id = ?';
    
    db.get(checkQuery, [parkingId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        
        if (!row) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        if (req.user.role !== 'admin' && row.user_id !== userId) {
            return res.status(403).json({ message: 'Keine Berechtigung' });
        }

        // Parkplatz löschen
        const deleteQuery = 'DELETE FROM reported_parking_spots WHERE id = ?';
        
        db.run(deleteQuery, [parkingId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            res.json({ message: 'Parkplatz erfolgreich gelöscht' });
        });
    });
});

module.exports = router;
