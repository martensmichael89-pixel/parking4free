# 🚗 Parking4Free

Eine moderne Webanwendung zur Suche und Verwaltung von Parkplätzen in Deutschland mit vollständigem Login-System und Admin-Panel.

## ✨ Features

### 🗺️ Karten & Navigation
- **OpenStreetMap Integration** mit Leaflet.js
- **Postleitzahl-Suche** für deutsche Städte
- **Interaktive Karten** mit Parkplatz-Markierungen
- **Mobile-optimierte** Touch-Navigation

### 👤 Benutzer-System
- **Registrierung & Login** mit JWT-Token
- **Profilverwaltung** für Benutzer
- **Favoriten-System** für Parkplätze
- **Sichere Authentifizierung** mit bcrypt

### 🔧 Admin-Panel
- **Dashboard** mit Statistiken
- **Benutzer-Verwaltung** (Anzeigen, Bearbeiten, Löschen)
- **Parkplatz-Verwaltung** (CRUD-Operationen)
- **System-Logs** und Monitoring

### 📱 Mobile Optimierung
- **Responsive Design** für alle Geräte
- **Touch-optimierte** Benutzeroberfläche
- **Hamburger-Menu** für mobile Navigation
- **Optimierte Karten-Performance**

## 🛠️ Technologie-Stack

### Frontend
- **HTML5** - Semantische Struktur
- **CSS3** - Moderne Styling mit Flexbox/Grid
- **JavaScript (ES6+)** - Interaktive Funktionalität
- **Leaflet.js** - Interaktive Karten
- **OpenStreetMap** - Kartendaten

### Backend
- **Node.js** - Server-Runtime
- **Express.js** - Web-Framework
- **SQLite** - Datenbank
- **JWT** - Token-basierte Authentifizierung
- **bcrypt** - Passwort-Hashing

### Deployment
- **Netlify** - Frontend-Hosting
- **Railway/Heroku** - Backend-Hosting
- **Git** - Versionskontrolle

## 🚀 Schnellstart

### Lokale Entwicklung

1. **Repository klonen:**
   ```bash
   git clone <repository-url>
   cd "FreePark v2"
   ```

2. **Backend starten:**
   ```bash
   cd backend
   npm install
   cp env.example .env
   node server.js
   ```

3. **Frontend starten:**
   ```bash
   python3 -m http.server 8003
   ```

4. **Anwendung öffnen:**
   - Frontend: `http://localhost:8003`
   - Backend API: `http://localhost:3001/api`

### Admin-Account
- **Email:** admin@parking4free.de
- **Passwort:** admin123

⚠️ **Wichtig:** Passwort nach dem ersten Login ändern!

## 📁 Projektstruktur

```
FreePark v2/
├── index.html              # Hauptseite
├── styles.css              # Styling
├── script.js               # Frontend-Logic
├── config.js               # Konfiguration
├── netlify.toml            # Netlify-Konfiguration
├── _headers                # HTTP-Header
├── _redirects              # Weiterleitungen
├── README.md               # Dokumentation
├── DEPLOYMENT-GUIDE.md     # Deployment-Anleitung
├── UPLOAD-CHECKLIST.md     # Upload-Checkliste
└── backend/                # Backend-Code
    ├── server.js           # Hauptserver
    ├── package.json        # Dependencies
    ├── database/           # Datenbank
    ├── routes/             # API-Routen
    ├── middleware/         # Middleware
    └── README.md           # Backend-Dokumentation
```

## 🔧 Konfiguration

### Frontend (config.js)
```javascript
const config = {
    development: {
        apiBaseUrl: 'http://localhost:3001/api',
        // ...
    },
    production: {
        apiBaseUrl: 'https://deine-backend-url.com/api',
        // ...
    }
};
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=dein-super-geheimer-schlüssel
CORS_ORIGIN=http://localhost:8003
```

## 📡 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `GET /api/auth/me` - Benutzer-Info abrufen
- `PUT /api/auth/change-password` - Passwort ändern

### Benutzer
- `GET /api/users/profile` - Profil abrufen
- `PUT /api/users/profile` - Profil bearbeiten
- `GET /api/users/favorites` - Favoriten abrufen
- `POST /api/users/favorites/:id` - Favorit hinzufügen
- `DELETE /api/users/favorites/:id` - Favorit entfernen

### Admin
- `GET /api/admin/dashboard` - Dashboard-Statistiken
- `GET /api/admin/users` - Benutzer verwalten
- `GET /api/admin/parking-spots` - Parkplätze verwalten
- `GET /api/admin/logs` - System-Logs

## 🚀 Deployment

### Frontend (Netlify)
1. `FreePark v2`-Ordner auf Netlify hochladen
2. Domain konfigurieren
3. SSL-Zertifikat aktivieren

### Backend (Railway/Heroku)
1. Repository mit Backend-Provider verbinden
2. Umgebungsvariablen setzen
3. Deploy starten

📖 **Detaillierte Anleitung:** Siehe `DEPLOYMENT-GUIDE.md`

## 🧪 Testing

### Funktionale Tests
- [ ] Login/Register funktioniert
- [ ] Karten laden korrekt
- [ ] Postleitzahl-Suche funktioniert
- [ ] Mobile Ansicht funktioniert
- [ ] Admin-Panel ist erreichbar

### Technische Tests
- [ ] Keine JavaScript-Fehler
- [ ] API-Calls funktionieren
- [ ] CORS-Fehler behoben
- [ ] Performance ist gut

## 🔒 Sicherheit

- **JWT-Token-Authentifizierung**
- **Passwort-Hashing** mit bcrypt
- **Rate Limiting** (100 Requests/15min)
- **CORS-Konfiguration**
- **Security-Headers** (Helmet)
- **Input-Validierung**

## 📱 Browser-Support

- ✅ Chrome (neueste Version)
- ✅ Firefox (neueste Version)
- ✅ Safari (neueste Version)
- ✅ Edge (neueste Version)
- ✅ Mobile Browser

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 📞 Support

- **Issues:** GitHub Issues
- **Email:** info@parking4free.de
- **Dokumentation:** Siehe `DEPLOYMENT-GUIDE.md`

---

**🎉 Parking4Free - Finde kostenlose Parkplätze in deiner Nähe!**
