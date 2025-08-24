# 🚀 Parking4Free - Netlify Deployment Guide

## 📋 Voraussetzungen

- Netlify-Account
- Backend-Server (Railway, Heroku, DigitalOcean, etc.)
- Git-Repository

## 🔧 Backend-Deployment

### Option 1: Railway (Empfohlen)
1. Gehe zu [railway.app](https://railway.app)
2. Verbinde dein GitHub-Repository
3. Wähle den `backend`-Ordner aus
4. Setze Umgebungsvariablen:
   ```
   NODE_ENV=production
   JWT_SECRET=dein-super-geheimer-schlüssel
   CORS_ORIGIN=https://deine-domain.netlify.app
   ```
5. Deploy starten

### Option 2: Heroku
1. Gehe zu [heroku.com](https://heroku.com)
2. Erstelle eine neue App
3. Verbinde dein Repository
4. Setze Buildpack: `heroku/nodejs`
5. Deploy starten

### Option 3: DigitalOcean App Platform
1. Gehe zu [digitalocean.com](https://digitalocean.com)
2. Erstelle eine neue App
3. Verbinde dein Repository
4. Wähle Node.js aus
5. Deploy starten

## 🌐 Frontend-Deployment auf Netlify

### Schritt 1: Repository vorbereiten
```bash
# Stelle sicher, dass alle Dateien im Hauptverzeichnis sind
cd "FreePark v2"
ls -la
```

### Schritt 2: Backend-URL konfigurieren
Bearbeite `config.js` und setze die echte Backend-URL:
```javascript
production: {
    apiBaseUrl: 'https://deine-backend-url.com/api', // Hier deine echte URL
    // ...
}
```

### Schritt 3: Netlify-Deployment

#### Option A: Drag & Drop
1. Gehe zu [netlify.com](https://netlify.com)
2. Ziehe den `FreePark v2`-Ordner in den Drop-Bereich
3. Warte auf das Deployment

#### Option B: Git-Integration
1. Gehe zu [netlify.com](https://netlify.com)
2. Klicke "New site from Git"
3. Verbinde dein GitHub-Repository
4. Setze Build-Einstellungen:
   - Build command: leer lassen
   - Publish directory: `FreePark v2`
5. Deploy starten

### Schritt 4: Domain konfigurieren
1. Gehe zu "Site settings" → "Domain management"
2. Klicke "Add custom domain"
3. Gib deine Domain ein (z.B. `parking4free.de`)
4. Folge den DNS-Anweisungen

## 🔒 Umgebungsvariablen

### Netlify (Frontend)
```bash
# Keine Umgebungsvariablen nötig - alles in config.js
```

### Backend
```bash
NODE_ENV=production
JWT_SECRET=dein-super-geheimer-schlüssel
CORS_ORIGIN=https://deine-domain.netlify.app
PORT=3000
```

## 📁 Dateistruktur für Netlify

```
FreePark v2/
├── index.html
├── styles.css
├── script.js
├── config.js
├── netlify.toml
├── _headers
├── _redirects
└── README.md
```

## 🔧 Konfigurationsdateien

### netlify.toml
```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://deine-backend-url.com;"
```

### _redirects
```
/* /index.html 200
```

### _headers
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## 🧪 Testing nach Deployment

### Frontend-Tests
1. Öffne deine Netlify-URL
2. Teste Login/Register
3. Teste Karten-Funktionalität
4. Teste mobile Ansicht

### Backend-Tests
```bash
# Health Check
curl https://deine-backend-url.com/api/health

# API-Test
curl -X POST https://deine-backend-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

## 🐛 Troubleshooting

### Häufige Probleme:

1. **CORS-Fehler:**
   - Überprüfe CORS_ORIGIN im Backend
   - Stelle sicher, dass die Frontend-URL korrekt ist

2. **API-Verbindungsfehler:**
   - Überprüfe die Backend-URL in `config.js`
   - Teste die Backend-URL direkt

3. **Build-Fehler:**
   - Überprüfe die Dateistruktur
   - Stelle sicher, dass alle Dateien im richtigen Ordner sind

4. **Domain-Probleme:**
   - Überprüfe DNS-Einstellungen
   - Warte auf DNS-Propagation (bis zu 24h)

## 📞 Support

Bei Problemen:
1. Überprüfe Netlify-Logs
2. Überprüfe Backend-Logs
3. Teste lokal mit `python3 -m http.server 8003`
4. Kontaktiere das Entwicklungsteam

## 🎉 Erfolgreiches Deployment

Nach erfolgreichem Deployment:
- ✅ Frontend läuft auf Netlify
- ✅ Backend läuft auf gewähltem Provider
- ✅ Login/Register funktioniert
- ✅ Karten laden korrekt
- ✅ Mobile Ansicht funktioniert
- ✅ Admin-Panel ist verfügbar

**Glückwunsch! Parking4Free ist live! 🚀**
