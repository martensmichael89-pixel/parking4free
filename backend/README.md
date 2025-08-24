# Parking4Free Backend

Vollständiges Backend für die Parking4Free Webanwendung mit Benutzerverwaltung und Admin-Panel.

## 🚀 Features

- **Benutzer-Authentifizierung** mit JWT-Tokens
- **Benutzer-Registrierung** und Login
- **Profilverwaltung** für Benutzer
- **Favoriten-System** für Parkplätze
- **Admin-Panel** für Website-Verwaltung
- **Parkplatz-API** mit CRUD-Operationen
- **SQLite-Datenbank** für einfache Bereitstellung
- **Sicherheitsfeatures** (Rate Limiting, Helmet, CORS)

## 📋 Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn

## 🛠️ Installation

1. **Dependencies installieren:**
   ```bash
   cd backend
   npm install
   ```

2. **Umgebungsvariablen konfigurieren:**
   ```bash
   cp env.example .env
   ```
   
   Bearbeiten Sie die `.env` Datei und ändern Sie den JWT_SECRET:
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=ihr-super-geheimer-schlüssel
   CORS_ORIGIN=http://localhost:8003
   ```

3. **Server starten:**
   ```bash
   # Entwicklung
   npm run dev
   
   # Produktion
   npm start
   ```

## 🔐 Admin-Account

Nach dem ersten Start wird automatisch ein Admin-Account erstellt:
- **Email:** admin@parking4free.de
- **Passwort:** admin123

⚠️ **Wichtig:** Ändern Sie das Admin-Passwort nach dem ersten Login!

## 📡 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `GET /api/auth/me` - Aktuellen Benutzer abrufen
- `PUT /api/auth/change-password` - Passwort ändern

### Benutzer
- `GET /api/users/profile` - Profil abrufen
- `PUT /api/users/profile` - Profil aktualisieren
- `GET /api/users/favorites` - Favoriten abrufen
- `POST /api/users/favorites/:id` - Favorit hinzufügen
- `DELETE /api/users/favorites/:id` - Favorit entfernen
- `GET /api/users/stats` - Benutzerstatistiken
- `DELETE /api/users/account` - Account löschen

### Parkplätze
- `GET /api/parking` - Alle Parkplätze abrufen
- `GET /api/parking/:id` - Parkplatz nach ID abrufen
- `POST /api/parking` - Neuen Parkplatz erstellen
- `PUT /api/parking/:id` - Parkplatz bearbeiten
- `DELETE /api/parking/:id` - Parkplatz löschen
- `PATCH /api/parking/:id/availability` - Verfügbarkeit ändern
- `GET /api/parking/nearby/:lat/:lng` - Parkplätze in der Nähe

### Admin (nur für Admins)
- `GET /api/admin/dashboard` - Dashboard-Statistiken
- `GET /api/admin/users` - Alle Benutzer abrufen
- `PUT /api/admin/users/:id/role` - Benutzer-Rolle ändern
- `DELETE /api/admin/users/:id` - Benutzer löschen
- `GET /api/admin/parking-spots` - Alle Parkplätze verwalten
- `PUT /api/admin/parking-spots/:id` - Parkplatz bearbeiten
- `DELETE /api/admin/parking-spots/:id` - Parkplatz löschen
- `GET /api/admin/logs` - System-Logs abrufen

## 🗄️ Datenbank

Die Anwendung verwendet SQLite für einfache Bereitstellung. Die Datenbank wird automatisch erstellt und mit Beispieldaten gefüllt.

### Tabellen:
- **users** - Benutzerkonten
- **parking_spots** - Parkplätze
- **user_favorites** - Benutzer-Favoriten

## 🔒 Sicherheit

- **JWT-Token-Authentifizierung**
- **Passwort-Hashing** mit bcrypt
- **Rate Limiting** (100 Requests pro 15 Minuten)
- **CORS-Konfiguration**
- **Helmet** für HTTP-Header-Sicherheit
- **Input-Validierung** auf allen Endpunkten

## 🚀 Deployment

### Lokale Entwicklung:
```bash
npm run dev
```

### Produktion:
```bash
npm start
```

### Mit PM2:
```bash
npm install -g pm2
pm2 start server.js --name parking4free-backend
```

## 📝 Logs

Die Anwendung loggt wichtige Ereignisse in die Konsole:
- Server-Start
- Datenbank-Initialisierung
- Admin-Account-Erstellung
- Beispieldaten-Import

## 🤝 Frontend-Integration

Das Backend ist für die Integration mit dem Parking4Free Frontend konfiguriert:
- CORS für `http://localhost:8003`
- JWT-Token-basierte Authentifizierung
- RESTful API-Design

## 🐛 Troubleshooting

### Häufige Probleme:

1. **Port bereits belegt:**
   ```bash
   # Anderen Port verwenden
   PORT=3001 npm start
   ```

2. **Datenbankfehler:**
   ```bash
   # Datenbank-Datei löschen und neu erstellen
   rm database/parking4free.db
   npm start
   ```

3. **CORS-Fehler:**
   - Überprüfen Sie die CORS_ORIGIN in der .env Datei
   - Stellen Sie sicher, dass das Frontend auf dem korrekten Port läuft

## 📞 Support

Bei Problemen oder Fragen erstellen Sie ein Issue im Repository oder kontaktieren Sie das Entwicklungsteam.
