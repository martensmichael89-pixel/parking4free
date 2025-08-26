const express = require('express');
const cors = require('cors');
// const helmet = require('helmet'); // KOMPLETT DEAKTIVIERT
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./database/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const parkingRoutes = require('./routes/parking');
const reportedParkingRoutes = require('./routes/reported-parking');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware - Helmet komplett deaktiviert
// app.use(helmet({
//     contentSecurityPolicy: false,
//     crossOriginEmbedderPolicy: false,
//     crossOriginOpenerPolicy: false,
//     crossOriginResourcePolicy: false
// }));
// CORS-Konfiguration
const corsOptions = {
    origin: function (origin, callback) {
        // Erlaube alle Origins für Entwicklung
        if (!origin || origin.includes('localhost') || origin.includes('github.io') || origin.includes('netlify.app')) {
            callback(null, true);
        } else {
            callback(new Error('CORS nicht erlaubt'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Zusätzliche CORS-Headers für alle Routen
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Rate Limiting - weniger restriktiv für Entwicklung
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (erhöht)
    message: {
        error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Erfolgreiche Anfragen nicht zählen
    skipFailedRequests: false
});

// Weniger restriktives Rate-Limiting für Auth-Routen
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 Login-Versuche pro 15 Minuten
    message: {
        error: 'Zu viele Login-Versuche. Bitte versuchen Sie es später erneut.',
        retryAfter: Math.ceil(15 * 60 / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate-Limiting nur in Produktion aktivieren
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
    app.use('/api/auth', authLimiter);
    console.log('Rate-Limiting aktiviert (Produktion)');
} else {
    console.log('Rate-Limiting deaktiviert (Entwicklung)');
}

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/reported-parking', reportedParkingRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
    console.log(`📡 API verfügbar unter: http://localhost:${PORT}/api`);
    
    // Datenbank initialisieren
    initDatabase().then(() => {
        console.log(`👑 Admin-Account: admin@parking4free.de / admin123`);
        console.log(`📊 Neue Tabellen: reported_parking_spots, user_statistics`);
    }).catch(err => {
        console.error('❌ Fehler beim Initialisieren der Datenbank:', err);
    });
});
