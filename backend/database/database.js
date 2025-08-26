const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'parking4free.db');
const db = new sqlite3.Database(dbPath);

// Tabellen erstellen
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users Tabelle
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Parking Spots Tabelle
            db.run(`
                CREATE TABLE IF NOT EXISTS parking_spots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    city TEXT NOT NULL,
                    type TEXT NOT NULL,
                    lat REAL,
                    lng REAL,
                    available BOOLEAN DEFAULT 1,
                    created_by INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            `);

            // User Favorites Tabelle
            db.run(`
                CREATE TABLE IF NOT EXISTS user_favorites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    parking_spot_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (parking_spot_id) REFERENCES parking_spots (id),
                    UNIQUE(user_id, parking_spot_id)
                )
            `);

            // Tabelle für gemeldete Parkplätze
            db.run(`
                CREATE TABLE IF NOT EXISTS reported_parking_spots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    address TEXT NOT NULL,
                    description TEXT,
                    spaces TEXT,
                    type TEXT NOT NULL,
                    disc_duration TEXT,
                    restriction_start TEXT,
                    restriction_end TEXT,
                    restriction_days TEXT,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    status TEXT DEFAULT 'pending',
                    rating_count INTEGER DEFAULT 0,
                    rating_score REAL DEFAULT 0,
                    last_confirmed DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // Tabelle für Parkplatz-Bewertungen
            db.run(`
                CREATE TABLE IF NOT EXISTS parking_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    parking_spot_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rating_type TEXT NOT NULL,
                    comment TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (parking_spot_id) REFERENCES reported_parking_spots (id),
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(parking_spot_id, user_id)
                )
            `);

            // User Statistics Tabelle
            db.run(`
                CREATE TABLE IF NOT EXISTS user_statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER UNIQUE NOT NULL,
                    reports INTEGER DEFAULT 0,
                    points INTEGER DEFAULT 0,
                    searches INTEGER DEFAULT 0,
                    favorites INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // Admin erstellen
            db.get("SELECT * FROM users WHERE email = 'admin@parking4free.de'", (err, row) => {
                if (!row) {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = bcrypt.hashSync('admin123', 10);
                    db.run(`
                        INSERT INTO users (name, email, password, role) 
                        VALUES (?, ?, ?, ?)
                    `, ['Admin', 'admin@parking4free.de', hashedPassword, 'admin']);
                    console.log('👑 Admin-Account erstellt: admin@parking4free.de / admin123');
                }
            });

            // Keine Beispieldaten mehr - nur gemeldete Parkplätze werden angezeigt
        });

        resolve();
    });
};

// Datenbank schließen
const closeDatabase = () => {
    db.close();
};

module.exports = { db, initDatabase, closeDatabase };
