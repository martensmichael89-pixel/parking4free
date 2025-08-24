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

            // Beispieldaten für Parkplätze
            db.get("SELECT COUNT(*) as count FROM parking_spots", (err, row) => {
                if (row.count === 0) {
                    const sampleData = [
                        ['Parkplatz Alexanderplatz', 'Alexanderplatz 1, 10178 Berlin', 'Berlin', 'paid', 52.5219, 13.4132, 1],
                        ['Kostenloser Parkplatz Tiergarten', 'Straße des 17. Juni, 10557 Berlin', 'Berlin', 'free', 52.5145, 13.3505, 1],
                        ['Parkhaus Rathaus Hamburg', 'Rathausmarkt 1, 20095 Hamburg', 'Hamburg', 'paid', 53.5511, 9.9937, 0],
                        ['Straßenparken St. Pauli', 'Reeperbahn 1, 20359 Hamburg', 'Hamburg', 'time-limited', 53.5488, 9.9542, 1],
                        ['Parkplatz Marienplatz', 'Marienplatz 1, 80331 München', 'München', 'paid', 48.1372, 11.5755, 1],
                        ['Kostenloser Parkplatz Olympiapark', 'Spiridon-Louis-Ring 21, 80809 München', 'München', 'free', 48.1758, 11.5497, 1],
                        ['Parkhaus Dom Köln', 'Domkloster 4, 50667 Köln', 'Köln', 'paid', 50.9375, 6.9603, 1],
                        ['Straßenparken Altstadt', 'Hohe Straße 1, 50667 Köln', 'Köln', 'time-limited', 50.9366, 6.9584, 0]
                    ];

                    const stmt = db.prepare(`
                        INSERT INTO parking_spots (name, address, city, type, lat, lng, available) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    sampleData.forEach(row => {
                        stmt.run(row);
                    });

                    stmt.finalize();
                    console.log('📍 Beispieldaten für Parkplätze eingefügt');
                }
            });
        });

        resolve();
    });
};

// Datenbank schließen
const closeDatabase = () => {
    db.close();
};

module.exports = { db, initDatabase, closeDatabase };
