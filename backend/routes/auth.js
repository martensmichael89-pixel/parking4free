const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/database');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Registrierung
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validierung
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Ungültige Email-Adresse' });
    }

    try {
        // Prüfen ob Email bereits existiert
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            if (user) {
                return res.status(400).json({ message: 'Email bereits registriert' });
            }

            // Passwort hashen
            const hashedPassword = await bcrypt.hash(password, 10);

            // Benutzer erstellen
            db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers' });
                    }

                    res.status(201).json({ 
                        message: 'Benutzer erfolgreich erstellt',
                        userId: this.lastID 
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Serverfehler' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validierung
    if (!email || !password) {
        return res.status(400).json({ message: 'Email und Passwort sind erforderlich' });
    }

    // Benutzer finden
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        // Passwort prüfen
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        // Token generieren
        const token = generateToken(user);

        // Benutzerdaten ohne Passwort zurückgeben
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login erfolgreich',
            token,
            user: userWithoutPassword
        });
    });
});

// Aktuellen Benutzer abrufen
router.get('/me', verifyToken, (req, res) => {
    const userId = req.user.id;

    db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        res.json({ user });
    });
});

// Passwort ändern
router.put('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
    }

    try {
        // Aktuelles Passwort prüfen
        db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Datenbankfehler' });
            }

            if (!user) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Aktuelles Passwort ist falsch' });
            }

            // Neues Passwort hashen und speichern
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Fehler beim Aktualisieren des Passworts' });
                }

                res.json({ message: 'Passwort erfolgreich geändert' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Serverfehler' });
    }
});

module.exports = router;
