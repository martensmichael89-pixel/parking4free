const jwt = require('jsonwebtoken');
const { db } = require('../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT Token generieren
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// JWT Token verifizieren
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Kein Token bereitgestellt' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Ungültiger Token' });
    }
};

// Admin-Berechtigung prüfen
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin-Berechtigung erforderlich' });
    }
    next();
};

// Benutzer-Berechtigung prüfen
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentifizierung erforderlich' });
    }
    next();
};

// Benutzer aus Datenbank laden
const loadUser = (req, res, next) => {
    const userId = req.user.id;
    
    db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Datenbankfehler' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        req.userData = user;
        next();
    });
};

module.exports = {
    generateToken,
    verifyToken,
    requireAdmin,
    requireAuth,
    loadUser,
    JWT_SECRET
};
