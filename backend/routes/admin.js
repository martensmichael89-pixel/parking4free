const express = require('express');
const { db } = require('../database/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Alle Routen erfordern Admin-Berechtigung
router.use(verifyToken);
router.use(requireAdmin);

// Dashboard-Statistiken
router.get('/dashboard', (req, res) => {
    const statsQuery = `
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
            (SELECT COUNT(*) FROM parking_spots) as total_parking_spots,
            (SELECT COUNT(*) FROM user_favorites) as total_favorites,
            (SELECT COUNT(*) FROM parking_spots WHERE available = 1) as available_spots,
            (SELECT COUNT(*) FROM parking_spots WHERE available = 0) as occupied_spots
    `;

    db.get(statsQuery, (err, stats) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        res.json({ stats });
    });
});

// Alle Benutzer abrufen
router.get('/users', (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, role, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let params = [];

    if (search) {
        query += ' WHERE name LIKE ? OR email LIKE ?';
        countQuery += ' WHERE name LIKE ? OR email LIKE ?';
        params = [`%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Gesamtanzahl abrufen
    db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : [], (err, countResult) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Benutzer abrufen
        db.all(query, params, (err, users) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Benutzer-Rolle ändern
router.put('/users/:userId/role', (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Ungültige Rolle' });
    }

    db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        res.json({ message: 'Benutzer-Rolle erfolgreich aktualisiert' });
    });
});

// Benutzer löschen
router.delete('/users/:userId', (req, res) => {
    const { userId } = req.params;

    // Prüfen ob Admin sich selbst löscht
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ message: 'Admin kann sich nicht selbst löschen' });
    }

    // Alle Favoriten des Benutzers löschen
    db.run('DELETE FROM user_favorites WHERE user_id = ?', [userId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Benutzer löschen
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            res.json({ message: 'Benutzer erfolgreich gelöscht' });
        });
    });
});

// Alle Parkplätze abrufen
router.get('/parking-spots', (req, res) => {
    const { page = 1, limit = 10, city = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT ps.*, u.name as created_by_name
        FROM parking_spots ps
        LEFT JOIN users u ON ps.created_by = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM parking_spots ps';
    let whereConditions = [];
    let params = [];

    if (city) {
        whereConditions.push('ps.city LIKE ?');
        params.push(`%${city}%`);
    }

    if (type) {
        whereConditions.push('ps.type = ?');
        params.push(type);
    }

    if (whereConditions.length > 0) {
        const whereClause = ' WHERE ' + whereConditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
    }

    query += ' ORDER BY ps.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Gesamtanzahl abrufen
    db.get(countQuery, city || type ? params.slice(0, -2) : [], (err, countResult) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Parkplätze abrufen
        db.all(query, params, (err, parkingSpots) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            res.json({
                parkingSpots,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Parkplatz bearbeiten
router.put('/parking-spots/:spotId', (req, res) => {
    const { spotId } = req.params;
    const { name, address, city, type, lat, lng, available } = req.body;

    if (!name || !address || !city || !type) {
        return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    const validTypes = ['free', 'paid', 'time-limited'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Ungültiger Parkplatz-Typ' });
    }

    db.run(`
        UPDATE parking_spots 
        SET name = ?, address = ?, city = ?, type = ?, lat = ?, lng = ?, available = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [name, address, city, type, lat, lng, available ? 1 : 0, spotId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
        }

        res.json({ message: 'Parkplatz erfolgreich aktualisiert' });
    });
});

// Parkplatz löschen
router.delete('/parking-spots/:spotId', (req, res) => {
    const { spotId } = req.params;

    // Alle Favoriten für diesen Parkplatz löschen
    db.run('DELETE FROM user_favorites WHERE parking_spot_id = ?', [spotId], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        // Parkplatz löschen
        db.run('DELETE FROM parking_spots WHERE id = ?', [spotId], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ message: 'Parkplatz nicht gefunden' });
            }

            res.json({ message: 'Parkplatz erfolgreich gelöscht' });
        });
    });
});

// System-Logs abrufen (vereinfacht)
router.get('/logs', (req, res) => {
    // In einer echten Anwendung würden hier Logs aus einer Datei oder Datenbank gelesen
    const mockLogs = [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Admin Dashboard aufgerufen' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Neuer Benutzer registriert' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARN', message: 'Viele fehlgeschlagene Login-Versuche' }
    ];

    res.json({ logs: mockLogs });
});

module.exports = router;
