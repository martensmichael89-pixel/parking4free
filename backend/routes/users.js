const express = require('express');
const { db } = require('../database/database');
const { verifyToken, loadUser } = require('../middleware/auth');

const router = express.Router();

// Alle Routen erfordern Authentifizierung
router.use(verifyToken);
router.use(loadUser);

// Benutzerprofil abrufen
router.get('/profile', (req, res) => {
    res.json({ user: req.userData });
});

// Benutzerprofil aktualisieren
router.put('/profile', (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name und Email sind erforderlich' });
    }

    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Ungültige Email-Adresse' });
    }

    // Prüfen ob Email bereits von anderem Benutzer verwendet wird
    db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (user) {
            return res.status(400).json({ message: 'Email bereits verwendet' });
        }

        // Profil aktualisieren
        db.run('UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [name, email, userId], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Fehler beim Aktualisieren des Profils' });
                }

                res.json({ 
                    message: 'Profil erfolgreich aktualisiert',
                    user: { ...req.userData, name, email }
                });
            });
    });
});

// Favoriten abrufen
router.get('/favorites', (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT ps.*, uf.created_at as favorited_at
        FROM user_favorites uf
        JOIN parking_spots ps ON uf.parking_spot_id = ps.id
        WHERE uf.user_id = ?
        ORDER BY uf.created_at DESC
    `;

    db.all(query, [userId], (err, favorites) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({ favorites });
    });
});

// Favorit hinzufügen
router.post('/favorites/:parkingSpotId', (req, res) => {
    const userId = req.user.id;
    const parkingSpotId = req.params.parkingSpotId;

    // Prüfen ob Parkplatz existiert
    db.get('SELECT id FROM parking_spots WHERE id = ?', [parkingSpotId], (err, parkingSpot) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!parkingSpot) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        // Prüfen ob bereits als Favorit markiert
        db.get('SELECT id FROM user_favorites WHERE user_id = ? AND parking_spot_id = ?', 
            [userId, parkingSpotId], (err, favorite) => {
                if (err) {
                    return res.status(500).json({ message: 'Datenbankfehler' });
                }

                if (favorite) {
                    return res.status(400).json({ message: 'Parkplatz ist bereits in den Favoriten' });
                }

                // Favorit hinzufügen
                db.run('INSERT INTO user_favorites (user_id, parking_spot_id) VALUES (?, ?)', 
                    [userId, parkingSpotId], function(err) {
                        if (err) {
                            return res.status(500).json({ message: 'Fehler beim Hinzufügen des Favoriten' });
                        }

                        res.status(201).json({ 
                            message: 'Favorit erfolgreich hinzugefügt',
                            favoriteId: this.lastID 
                        });
                    });
            });
    });
});

// Favorit entfernen
router.delete('/favorites/:parkingSpotId', (req, res) => {
    const userId = req.user.id;
    const parkingSpotId = req.params.parkingSpotId;

    db.run('DELETE FROM user_favorites WHERE user_id = ? AND parking_spot_id = ?', 
        [userId, parkingSpotId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Favorit nicht gefunden' });
            }

            res.json({ message: 'Favorit erfolgreich entfernt' });
        });
});

// Benutzerstatistiken
router.get('/stats', (req, res) => {
    const userId = req.user.id;

    const statsQuery = `
        SELECT 
            (SELECT COUNT(*) FROM user_favorites WHERE user_id = ?) as total_favorites,
            (SELECT COUNT(*) FROM parking_spots WHERE created_by = ?) as total_added_spots
    `;

    db.get(statsQuery, [userId, userId], (err, stats) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({ stats });
    });
});

// Benutzer löschen (eigener Account)
router.delete('/account', (req, res) => {
    const userId = req.user.id;

    // Alle Favoriten des Benutzers löschen
    db.run('DELETE FROM user_favorites WHERE user_id = ?', [userId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Benutzer löschen
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Fehler beim Löschen des Accounts' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            res.json({ message: 'Account erfolgreich gelöscht' });
        });
    });
});

module.exports = router;
