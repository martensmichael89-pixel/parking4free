# 🚀 Netlify Deployment Guide - FreePark v2

## Schnellstart (Drag & Drop)

### Schritt 1: Netlify-Konto erstellen
1. Besuchen Sie [netlify.com](https://netlify.com)
2. Klicken Sie auf "Sign up"
3. Wählen Sie Ihre bevorzugte Anmeldemethode (GitHub, GitLab, Bitbucket oder Email)

### Schritt 2: Projekt hochladen
1. Nach der Anmeldung sehen Sie das Netlify-Dashboard
2. Ziehen Sie den gesamten `FreePark v2` Ordner in den markierten Bereich
3. Netlify erkennt automatisch die Konfiguration und startet das Deployment

### Schritt 3: Deployment überwachen
1. Das Deployment beginnt automatisch
2. Sie sehen den Fortschritt in Echtzeit
3. Nach erfolgreichem Deployment erhalten Sie eine URL (z.B. `https://random-name.netlify.app`)

### Schritt 4: Domain anpassen (optional)
1. Klicken Sie auf "Site settings"
2. Unter "Domain management" können Sie:
   - Den Site-Namen ändern
   - Eine benutzerdefinierte Domain hinzufügen
   - SSL-Zertifikat konfigurieren

## Git-basiertes Deployment

### GitHub Integration
1. **Repository erstellen:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Zu GitHub hochladen:**
   - Erstellen Sie ein neues Repository auf GitHub
   - Folgen Sie den Anweisungen zum Hochladen

3. **Netlify verbinden:**
   - In Netlify: "New site from Git"
   - Wählen Sie GitHub als Provider
   - Wählen Sie Ihr Repository
   - Build-Einstellungen:
     - Build command: leer lassen
     - Publish directory: `.` (Punkt)

### Automatische Deployments
- Jeder Push zu `main` branch löst automatisch ein neues Deployment aus
- Pull Requests erstellen automatisch Preview-Deployments

## Konfigurationsdateien

### netlify.toml
```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://*.tile.openstreetmap.org; connect-src 'self' https://*.tile.openstreetmap.org;"
```

### _redirects
```
/*    /index.html   200
```

### _headers
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://*.tile.openstreetmap.org; connect-src 'self' https://*.tile.openstreetmap.org;
```

## Netlify CLI (Fortgeschrittene)

### Installation
```bash
npm install -g netlify-cli
```

### Login
```bash
netlify login
```

### Projekt initialisieren
```bash
netlify init
```

### Deployment
```bash
# Preview Deployment
netlify deploy

# Produktions-Deployment
netlify deploy --prod
```

## Häufige Probleme & Lösungen

### Problem: Karte wird nicht angezeigt
**Lösung:** Überprüfen Sie die Content Security Policy in `_headers` oder `netlify.toml`

### Problem: Navigation funktioniert nicht
**Lösung:** Stellen Sie sicher, dass `_redirects` Datei vorhanden ist

### Problem: Mobile Menü funktioniert nicht
**Lösung:** Überprüfen Sie die JavaScript-Konsole auf Fehler

### Problem: OpenStreetMap Tiles laden nicht
**Lösung:** Überprüfen Sie die CSP-Einstellungen für `*.tile.openstreetmap.org`

## Performance-Optimierung

### Netlify-spezifische Optimierungen
1. **Asset-Optimierung:**
   - Bilder komprimieren
   - CSS/JS minifizieren (optional)

2. **Caching:**
   - Netlify cacht automatisch statische Assets
   - Headers können für besseres Caching angepasst werden

3. **CDN:**
   - Netlify verwendet automatisch ein globales CDN
   - Keine zusätzliche Konfiguration erforderlich

## Monitoring & Analytics

### Netlify Analytics
1. Gehen Sie zu "Site settings" > "Analytics"
2. Aktivieren Sie "Netlify Analytics"
3. Verfolgen Sie Besucher, Seitenaufrufe und Performance

### Custom Domain mit SSL
1. Fügen Sie Ihre Domain in "Domain management" hinzu
2. Netlify stellt automatisch SSL-Zertifikate bereit
3. DNS-Einstellungen entsprechend anpassen

## Support & Troubleshooting

### Netlify Support
- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [Netlify Status](https://status.netlify.com/)

### Debugging
1. **Build-Logs:** Überprüfen Sie die Build-Logs in Netlify
2. **Browser-Konsole:** Entwicklertools für JavaScript-Fehler
3. **Network-Tab:** Überprüfen Sie API-Aufrufe und Asset-Loading

---

**Hinweis:** Netlify bietet ein kostenloses Tier mit 100GB Bandbreite pro Monat, was für die meisten Projekte ausreichend ist.
