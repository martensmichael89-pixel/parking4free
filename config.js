// Konfiguration für verschiedene Umgebungen
const config = {
    development: {
        apiBaseUrl: 'http://localhost:3001/api',
        mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        mapAttribution: '© OpenStreetMap contributors'
    },
    production: {
        apiBaseUrl: 'https://parking4free-backend.onrender.com/api', // Hier deine Render-URL eintragen
        mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        mapAttribution: '© OpenStreetMap contributors'
    }
};

// Automatische Umgebungserkennung
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const currentConfig = config[isDevelopment ? 'development' : 'production'];

// Globale Konfiguration exportieren
window.Parking4FreeConfig = currentConfig;
