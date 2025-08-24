const express = require('express');
const { db } = require('../database/database');
const { verifyToken, loadUser } = require('../middleware/auth');

const router = express.Router();

// Alle Parkplätze abrufen (öffentlich)
router.get('/', (req, res) => {
    const { city = '', type = '', available = '' } = req.query;

    let query = 'SELECT * FROM parking_spots';
    let whereConditions = [];
    let params = [];

    if (city) {
        whereConditions.push('city LIKE ?');
        params.push(`%${city}%`);
    }

    if (type) {
        whereConditions.push('type = ?');
        params.push(type);
    }

    if (available !== '') {
        whereConditions.push('available = ?');
        params.push(available === 'true' ? 1 : 0);
    }

    if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, parkingSpots) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({ parkingSpots });
    });
});

// Parkplatz nach ID abrufen
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM parking_spots WHERE id = ?', [id], (err, parkingSpot) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!parkingSpot) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        res.json({ parkingSpot });
    });
});

// Neuen Parkplatz erstellen (nur angemeldete Benutzer)
router.post('/', verifyToken, loadUser, (req, res) => {
    const { name, address, city, type, lat, lng, available = true } = req.body;
    const createdBy = req.user.id;

    // Validierung
    if (!name || !address || !city || !type) {
        return res.status(400).json({ message: 'Name, Adresse, Stadt und Typ sind erforderlich' });
    }

    const validTypes = ['free', 'paid', 'time-limited'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Ungültiger Parkplatz-Typ' });
    }

    // Koordinaten validieren
    if (lat && (lat < -90 || lat > 90)) {
        return res.status(400).json({ message: 'Ungültige Breitengrad-Koordinate' });
    }

    if (lng && (lng < -180 || lng > 180)) {
        return res.status(400).json({ message: 'Ungültige Längengrad-Koordinate' });
    }

    db.run(`
        INSERT INTO parking_spots (name, address, city, type, lat, lng, available, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, address, city, type, lat, lng, available ? 1 : 0, createdBy], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Fehler beim Erstellen des Parkplatzes' });
        }

        // Erstellten Parkplatz zurückgeben
        db.get('SELECT * FROM parking_spots WHERE id = ?', [this.lastID], (err, parkingSpot) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            res.status(201).json({ 
                message: 'Parkplatz erfolgreich erstellt',
                parkingSpot 
            });
        });
    });
});

// Parkplatz bearbeiten (nur Ersteller oder Admin)
router.put('/:id', verifyToken, loadUser, (req, res) => {
    const { id } = req.params;
    const { name, address, city, type, lat, lng, available } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Prüfen ob Benutzer berechtigt ist
    db.get('SELECT created_by FROM parking_spots WHERE id = ?', [id], (err, parkingSpot) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!parkingSpot) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        if (userRole !== 'admin' && parkingSpot.created_by !== userId) {
            return res.status(403).json({ message: 'Keine Berechtigung zum Bearbeiten dieses Parkplatzes' });
        }

        // Validierung
        if (!name || !address || !city || !type) {
            return res.status(400).json({ message: 'Name, Adresse, Stadt und Typ sind erforderlich' });
        }

        const validTypes = ['free', 'paid', 'time-limited'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Ungültiger Parkplatz-Typ' });
        }

        // Parkplatz aktualisieren
        db.run(`
            UPDATE parking_spots 
            SET name = ?, address = ?, city = ?, type = ?, lat = ?, lng = ?, available = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, address, city, type, lat, lng, available ? 1 : 0, id], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            res.json({ message: 'Parkplatz erfolgreich aktualisiert' });
        });
    });
});

// Parkplatz löschen (nur Ersteller oder Admin)
router.delete('/:id', verifyToken, loadUser, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Prüfen ob Benutzer berechtigt ist
    db.get('SELECT created_by FROM parking_spots WHERE id = ?', [id], (err, parkingSpot) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!parkingSpot) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        if (userRole !== 'admin' && parkingSpot.created_by !== userId) {
            return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieses Parkplatzes' });
        }

        // Alle Favoriten für diesen Parkplatz löschen
        db.run('DELETE FROM user_favorites WHERE parking_spot_id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            // Parkplatz löschen
            db.run('DELETE FROM parking_spots WHERE id = ?', [id], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Datenbankfehler' });
                }

                res.json({ message: 'Parkplatz erfolgreich gelöscht' });
            });
        });
    });
});

// Verfügbarkeit eines Parkplatzes ändern
router.patch('/:id/availability', verifyToken, loadUser, (req, res) => {
    const { id } = req.params;
    const { available } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (typeof available !== 'boolean') {
        return res.status(400).json({ message: 'Verfügbarkeit muss ein Boolean-Wert sein' });
    }

    // Prüfen ob Benutzer berechtigt ist
    db.get('SELECT created_by FROM parking_spots WHERE id = ?', [id], (err, parkingSpot) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!parkingSpot) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        if (userRole !== 'admin' && parkingSpot.created_by !== userId) {
            return res.status(403).json({ message: 'Keine Berechtigung zum Ändern der Verfügbarkeit' });
        }

        // Verfügbarkeit aktualisieren
        db.run('UPDATE parking_spots SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [available ? 1 : 0, id], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Datenbankfehler' });
                }

                res.json({ 
                    message: 'Verfügbarkeit erfolgreich aktualisiert',
                    available 
                });
            });
    });
});

// Parkplätze in der Nähe suchen
router.get('/nearby/:lat/:lng', (req, res) => {
    const { lat, lng, radius = 5 } = req.params;
    const maxRadius = parseFloat(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(maxRadius)) {
        return res.status(400).json({ message: 'Ungültige Koordinaten oder Radius' });
    }

    // Einfache Entfernungsberechnung (Haversine-Formel vereinfacht)
    const query = `
        SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
        FROM parking_spots 
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        HAVING distance <= ?
        ORDER BY distance
    `;

    db.all(query, [lat, lng, lat, maxRadius], (err, parkingSpots) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({ 
            parkingSpots,
            searchLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: maxRadius
        });
    });
});

module.exports = router;
