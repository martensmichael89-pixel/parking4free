// FreePark v2 - JavaScript Funktionalität

class FreeParkApp {
    constructor() {
        console.log('Parking4Free App wird initialisiert...');
        this.map = null;
        this.homeMap = null;
        this.markers = [];
        this.homeMarkers = [];
        this.currentSection = 'home';
        this.parkingData = this.generateSampleData();
        this.currentUser = null;
        this.apiBaseUrl = window.Parking4FreeConfig?.apiBaseUrl || 'http://localhost:3000/api';
        console.log('API Base URL:', this.apiBaseUrl);
        
        this.init();
    }

    init() {
        console.log('init() aufgerufen');
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupMap();
        this.setupHomeMap();
        this.setupEventListeners();
        this.setupAuth();
        this.setupMemberEventListeners();
        this.loadParkingList();
        this.loadReportedParkingSpots();
        this.checkAuthStatus();
        
        // Marker nach vollständiger Initialisierung hinzufügen
        console.log('Füge Marker hinzu...');
        this.addSampleMarkers();
        this.addHomeMapMarkers();
        
        console.log('init() abgeschlossen');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // Aktive Klasse aktualisieren
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                
                // Hamburger Animation
                const spans = mobileToggle.querySelectorAll('span');
                spans.forEach((span, index) => {
                    if (nav.classList.contains('active')) {
                        if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
                        if (index === 1) span.style.opacity = '0';
                        if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
                    } else {
                        span.style.transform = 'none';
                        span.style.opacity = '1';
                    }
                });
            });
        }

        // Menü schließen beim Klick auf einen Link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav && mobileToggle) {
                    nav.classList.remove('active');
                    const spans = mobileToggle.querySelectorAll('span');
                    spans.forEach(span => {
                        span.style.transform = 'none';
                        span.style.opacity = '1';
                    });
                }
            });
        });
    }

    setupMap() {
        // Karte initialisieren (Deutschland Zentrum)
        this.map = L.map('main-map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: true,
            dragging: true,
            touchZoom: true
        }).setView([51.1657, 10.4515], 6);
        
        // OpenStreetMap Tile Layer hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            subdomains: 'abc'
        }).addTo(this.map);

        // Beispieldaten werden später in init() hinzugefügt
    }

    setupHomeMap() {
        // Home-Karte initialisieren (Deutschland Zentrum)
        this.homeMap = L.map('home-map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: false,
            keyboard: true,
            dragging: true,
            touchZoom: true
        }).setView([51.1657, 10.4515], 6);
        
        // OpenStreetMap Tile Layer hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            subdomains: 'abc'
        }).addTo(this.homeMap);

        // Direkte Karten-Klick-Funktion für Parkplatz-Meldung (nur wenn eingeloggt)
        this.homeMap.on('click', (e) => {
            console.log('Karte geklickt, currentUser:', this.currentUser);
            if (this.currentUser) {
                console.log('Benutzer eingeloggt, handleDirectMapClick aufrufen');
                this.handleDirectMapClick(e);
            } else {
                console.log('Benutzer nicht eingeloggt, Popup nicht anzeigen');
            }
        });

        // Beispieldaten werden später in init() hinzugefügt
    }

    handleDirectMapClick(e) {
        console.log('handleDirectMapClick aufgerufen');
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        console.log('Koordinaten:', lat, lng);
        
        // Popup mit Optionen anzeigen
        const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
                <div style="text-align: center; min-width: 250px;">
                    <h3 style="color: #4ade80; margin: 0 0 15px 0;">🚗 Parkplatz melden?</h3>
                    <p style="margin: 10px 0; color: #333;">
                        <strong>Standort:</strong><br>
                        ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                        <button onclick="app.openReportFormAtLocation(${lat}, ${lng})" 
                                style="background: #4ade80; color: black; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            ✅ Ja, melden
                        </button>
                        <button onclick="app.closePopup()" 
                                style="background: #666; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                            ❌ Abbrechen
                        </button>
                    </div>
                </div>
            `)
            .openOn(this.homeMap);
        
        this.currentPopup = popup;
        console.log('Popup erstellt und angezeigt');
    }

    openReportFormAtLocation(lat, lng) {
        // Popup schließen
        if (this.currentPopup) {
            this.homeMap.closePopup(this.currentPopup);
        }
        
        // Koordinaten setzen
        this.setSelectedCoordinates(lat, lng);
        
        // Modal öffnen
        const reportModal = document.getElementById('report-parking-modal');
        this.showModal(reportModal);
        
        this.showNotification('Füllen Sie das Formular aus, um den Parkplatz zu melden', 'info');
    }

    closePopup() {
        if (this.currentPopup) {
            this.homeMap.closePopup(this.currentPopup);
        }
    }

    addHomeMapMarkers() {
        // Keine Beispieldaten mehr - nur gemeldete Parkplätze werden angezeigt
    }

    addSampleMarkers() {
        // Keine Beispieldaten mehr - nur gemeldete Parkplätze werden angezeigt
    }

    getMarkerColor(type, available) {
        if (!available) return '#ff4444';
        switch (type) {
            case 'free': return '#00ff00';
            case 'paid': return '#ffaa00';
            case 'time-limited': return '#00aaff';
            default: return '#888888';
        }
    }

    getTypeLabel(type) {
        switch (type) {
            case 'free': return 'Kostenlos';
            case 'paid': return 'Kostenpflichtig';
            case 'time-limited': return 'Zeitlich begrenzt';
            default: return 'Unbekannt';
        }
    }

    getPriceLabel(type) {
        switch (type) {
            case 'free': return 'Kostenlos';
            case 'paid': return '€2-5/Stunde';
            case 'time-limited': return '2h kostenlos';
            default: return 'Unbekannt';
        }
    }

    showDirections(lat, lng) {
        const url = `https://www.openstreetmap.org/directions?from=&to=${lat},${lng}`;
        window.open(url, '_blank');
    }

    setupEventListeners() {
        // Karten-Suche
        const searchBtn = document.getElementById('search-btn');
        const locationSearch = document.getElementById('location-search');
        
        if (searchBtn && locationSearch) {
            searchBtn.addEventListener('click', () => {
                this.searchLocation(locationSearch.value);
            });
            
            locationSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLocation(locationSearch.value);
                }
            });
        }

        // Erweiterte Suche
        const advancedSearchBtn = document.getElementById('advanced-search-btn');
        if (advancedSearchBtn) {
            advancedSearchBtn.addEventListener('click', () => {
                this.performAdvancedSearch();
            });
        }

        // Listen-Filter
        const cityFilter = document.getElementById('city-filter');
        const typeFilter = document.getElementById('type-filter');
        
        if (cityFilter) {
            cityFilter.addEventListener('change', () => {
                this.filterParkingList();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterParkingList();
            });
        }
    }



    searchLocation(query) {
        if (!query.trim()) return;
        
        // Einfache Geocoding-Simulation
        const locations = {
            'berlin': [52.5200, 13.4050],
            'hamburg': [53.5511, 9.9937],
            'münchen': [48.1351, 11.5820],
            'köln': [50.9375, 6.9603],
            'frankfurt': [50.1109, 8.6821],
            'stuttgart': [48.7758, 9.1829],
            'düsseldorf': [51.2277, 6.7735],
            'dortmund': [51.5136, 7.4653]
        };

        const queryLower = query.toLowerCase();
        let found = false;

        for (const [city, coords] of Object.entries(locations)) {
            if (city.includes(queryLower) || queryLower.includes(city)) {
                this.map.setView(coords, 12);
                found = true;
                break;
            }
        }

        if (!found) {
            // Fallback: Deutschland Zentrum
            this.map.setView([51.1657, 10.4515], 6);
            this.showNotification('Ort nicht gefunden. Bitte versuchen Sie einen anderen Suchbegriff.', 'warning');
        }
    }

    performAdvancedSearch() {
        const location = document.getElementById('search-location').value;
        const radius = document.getElementById('search-radius').value;
        const type = document.getElementById('search-type').value;
        const availableNow = document.getElementById('available-now').checked;
        const overnight = document.getElementById('overnight').checked;

        // Simulierte Suche
        this.showNotification('Suche wird durchgeführt...', 'info');
        
        setTimeout(() => {
            const results = this.parkingData.filter(item => {
                if (location && !item.name.toLowerCase().includes(location.toLowerCase())) return false;
                if (type && item.type !== type) return false;
                if (availableNow && !item.available) return false;
                return true;
            });

            this.displaySearchResults(results);
            this.showNotification(`${results.length} Ergebnisse gefunden`, 'success');
        }, 1500);
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: #cccccc;">Keine Ergebnisse gefunden.</p>';
            return;
        }

        const resultsHTML = results.map(item => `
            <div class="parking-item">
                <h3>${item.name}</h3>
                <p>${item.address}</p>
                <div class="parking-meta">
                    <span>${this.getTypeLabel(item.type)}</span>
                    <span>${item.available ? 'Verfügbar' : 'Besetzt'}</span>
                    <span>${this.getPriceLabel(item.type)}</span>
                </div>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    loadParkingList() {
        const parkingList = document.getElementById('parking-list');
        if (!parkingList) return;

        const listHTML = this.parkingData.map(item => `
            <div class="parking-item">
                <h3>${item.name}</h3>
                <p>${item.address}</p>
                <div class="parking-meta">
                    <span>${this.getTypeLabel(item.type)}</span>
                    <span>${item.available ? 'Verfügbar' : 'Besetzt'}</span>
                    <span>${this.getPriceLabel(item.type)}</span>
                </div>
            </div>
        `).join('');

        parkingList.innerHTML = listHTML;
    }

    loadReportedParkingSpots() {
        fetch(`${this.apiBaseUrl}/reported-parking`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Gemeldete Parkplätze geladen:', data);
                // Sicherstellen, dass data ein Array ist
                const parkingSpots = Array.isArray(data) ? data : [];
                this.displayReportedParkingSpots(parkingSpots);
            })
            .catch(error => {
                console.error('Fehler beim Laden der gemeldeten Parkplätze:', error);
                // Fallback: Lokale Daten laden
                const localSpots = JSON.parse(localStorage.getItem('localParkingSpots') || '[]');
                this.displayReportedParkingSpots(localSpots);
            });
    }

    displayReportedParkingSpots(parkingSpots) {
        // Bestehende Marker entfernen
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.homeMarkers.forEach(marker => {
            this.homeMap.removeLayer(marker);
        });
        this.markers = [];
        this.homeMarkers = [];

        // Neue Marker hinzufügen
        parkingSpots.forEach(spot => {
            const markerColor = this.getMarkerColor(spot.type, true);
            
            // Marker für Hauptkarte
            const marker = L.circleMarker([spot.latitude, spot.longitude], {
                radius: 8,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            const popupContent = `
                <div style="text-align: center; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #00ff00;">${spot.name}</h3>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>Typ:</strong> ${this.getTypeLabel(spot.type)}<br>
                        <strong>Status:</strong> Verfügbar<br>
                        <strong>Gemeldet von:</strong> ${spot.reporter_name || 'Unbekannt'}<br>
                        ${spot.description ? `<strong>Beschreibung:</strong> ${spot.description}<br>` : ''}
                        ${spot.restrictions ? `<strong>Einschränkungen:</strong> ${spot.restrictions}<br>` : ''}
                    </p>
                    <button onclick="app.showDirections(${spot.latitude}, ${spot.longitude})" 
                            style="background: #00ff00; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-weight: bold;">
                        Route anzeigen
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.markers.push(marker);

            // Marker für Home-Karte
            const homeMarker = L.circleMarker([spot.latitude, spot.longitude], {
                radius: 6,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.homeMap);

            const homePopupContent = `
                <div style="text-align: center; min-width: 180px;">
                    <h3 style="margin: 0 0 8px 0; color: #00ff00; font-size: 14px;">${spot.name}</h3>
                    <p style="margin: 3px 0; color: #333; font-size: 12px;">
                        <strong>Typ:</strong> ${this.getTypeLabel(spot.type)}<br>
                        <strong>Status:</strong> Verfügbar<br>
                        <strong>Gemeldet von:</strong> ${spot.reporter_name || 'Unbekannt'}
                    </p>
                </div>
            `;

            homeMarker.bindPopup(homePopupContent);
            this.homeMarkers.push(homeMarker);
        });
    }

    getReportedTypeLabel(type) {
        switch (type) {
            case 'permanent-free': return '🅿️ Dauerhaft kostenlos';
            case 'time-limited': return '⏰ Zeitlich begrenzt';
            case 'parking-disc': return '🕐 Parkscheibe erforderlich';
            case 'restricted': return '⚠️ Eingeschränktes Halteverbot (aufgehoben)';
            case 'absolute': return '🚫 Absolutes Halteverbot (aufgehoben)';
            default: return '❓ Unbekannt';
        }
    }

    formatTimeRestrictions(restrictions) {
        if (!restrictions) return 'Keine';
        
        const days = {
            'mo': 'Mo', 'di': 'Di', 'mi': 'Mi', 'do': 'Do', 
            'fr': 'Fr', 'sa': 'Sa', 'so': 'So'
        };
        
        const dayNames = restrictions.days.map(day => days[day]).join(', ');
        return `${restrictions.from} - ${restrictions.to} Uhr (${dayNames})`;
    }

    addReportedSpotToMap(report) {
        if (!report.coordinates || report.coordinates === 'Noch nicht markiert') return;
        
        const [lat, lng] = report.coordinates.split(', ').map(coord => parseFloat(coord));
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'reported-parking-marker',
                html: '<div style="background: #4ade80; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        });

        const popupContent = `
            <div style="min-width: 200px;">
                <h3 style="color: #4ade80; margin: 0 0 10px 0;">🚨 Gemeldeter Parkplatz</h3>
                <p><strong>Adresse:</strong> ${report.address}</p>
                <p><strong>Typ:</strong> ${this.getReportedTypeLabel(report.type)}</p>
                <p><strong>Gemeldet von:</strong> ${report.userId}</p>
                <p><strong>Datum:</strong> ${new Date(report.timestamp).toLocaleDateString('de-DE')}</p>
                ${report.description ? `<p><strong>Beschreibung:</strong> ${report.description}</p>` : ''}
                ${report.timeRestrictions ? `<p><strong>Zeitliche Einschränkungen:</strong> ${this.formatTimeRestrictions(report.timeRestrictions)}</p>` : ''}
                <div style="margin-top: 10px; padding: 5px; background: #1a1a1a; border-radius: 3px;">
                    <small style="color: #888888;">Status: ${report.status === 'pending' ? '⏳ Wartet auf Überprüfung' : '✅ Bestätigt'}</small>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        
        // Marker zur Karte hinzufügen
        if (this.map) {
            marker.addTo(this.map);
        }
        
        // Marker zur Liste hinzufügen
        if (!this.reportedMarkers) {
            this.reportedMarkers = [];
        }
        this.reportedMarkers.push(marker);
    }

    filterParkingList() {
        const cityFilter = document.getElementById('city-filter');
        const typeFilter = document.getElementById('type-filter');
        const parkingList = document.getElementById('parking-list');

        if (!parkingList) return;

        const cityValue = cityFilter ? cityFilter.value : '';
        const typeValue = typeFilter ? typeFilter.value : '';

        let filteredData = this.parkingData;

        if (cityValue) {
            filteredData = filteredData.filter(item => 
                item.city.toLowerCase() === cityValue.toLowerCase()
            );
        }

        if (typeValue) {
            filteredData = filteredData.filter(item => 
                item.type === typeValue
            );
        }

        const listHTML = filteredData.map(item => `
            <div class="parking-item">
                <h3>${item.name}</h3>
                <p>${item.address}</p>
                <div class="parking-meta">
                    <span>${this.getTypeLabel(item.type)}</span>
                    <span>${item.available ? 'Verfügbar' : 'Besetzt'}</span>
                    <span>${this.getPriceLabel(item.type)}</span>
                </div>
            </div>
        `).join('');

        parkingList.innerHTML = listHTML;
    }

    showSection(sectionName) {
        // Alle Sektionen ausblenden
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Gewünschte Sektion anzeigen
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;

            // Karten neu laden wenn Sektionen aktiviert werden
            if (sectionName === 'map' && this.map) {
                setTimeout(() => {
                    this.map.invalidateSize();
                }, 100);
            }
            
            if (sectionName === 'home' && this.homeMap) {
                setTimeout(() => {
                    this.homeMap.invalidateSize();
                }, 100);
            }
        }
    }

    showNotification(message, type = 'info') {
        // Einfache Benachrichtigung erstellen
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#00ff00';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffaa00';
                break;
            case 'error':
                notification.style.backgroundColor = '#ff4444';
                break;
            default:
                notification.style.backgroundColor = '#333333';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Nach 3 Sekunden entfernen
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

        setupAuth() {
        console.log('setupAuth aufgerufen');
        // Login Modal
        const loginBtn = document.getElementById('login-btn');
        const loginModal = document.getElementById('login-modal');
        const closeLogin = document.getElementById('close-login');
        const loginForm = document.getElementById('login-form');
        
        console.log('Login Button:', loginBtn);
        console.log('Login Modal:', loginModal);
        console.log('Login Form:', loginForm);
        
        // Register Modal
        const registerBtn = document.getElementById('register-btn');
        const registerModal = document.getElementById('register-modal');
        const closeRegister = document.getElementById('close-register');
        const registerForm = document.getElementById('register-form');

        // Parkplatz Melden Modal
        const reportParkingBtn = document.getElementById('report-parking-btn');
        const reportParkingModal = document.getElementById('report-parking-modal');
        const closeReportParking = document.getElementById('close-report-parking');
        const reportParkingForm = document.getElementById('report-parking-form');

        // Logout
        const logoutBtn = document.getElementById('logout-btn');

        // Event Listeners
        if (loginBtn) {
            console.log('Login Button Event Listener hinzugefügt');
            loginBtn.addEventListener('click', () => {
                console.log('Login Button geklickt');
                this.showModal(loginModal);
            });
        } else {
            console.log('Login Button nicht gefunden!');
        }
        registerBtn.addEventListener('click', () => this.showModal(registerModal));
        closeLogin.addEventListener('click', () => this.hideModal(loginModal));
        closeRegister.addEventListener('click', () => this.hideModal(registerModal));
        logoutBtn.addEventListener('click', () => this.logout());

        // Parkplatz Melden Event Listeners
        if (reportParkingBtn) {
            reportParkingBtn.addEventListener('click', () => this.showModal(reportParkingModal));
        }
        if (closeReportParking) {
            closeReportParking.addEventListener('click', () => this.hideModal(reportParkingModal));
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) this.hideModal(loginModal);
            if (e.target === registerModal) this.hideModal(registerModal);
            if (e.target === reportParkingModal) this.hideModal(reportParkingModal);
        });

        // Form submissions
        if (loginForm) {
            console.log('Login Form Event Listener hinzugefügt');
            loginForm.addEventListener('submit', (e) => {
                console.log('Login Form submitted');
                e.preventDefault();
                this.handleLogin();
            });
        } else {
            console.log('Login Form nicht gefunden!');
        }

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Parkplatz Melden Form
        if (reportParkingForm) {
            reportParkingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleParkingReport();
            });
        }

        // Standort-Buttons
        const useCurrentLocationBtn = document.getElementById('use-current-location');
        const selectOnMapBtn = document.getElementById('select-on-map');

        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => this.useCurrentLocation());
        }
        if (selectOnMapBtn) {
            selectOnMapBtn.addEventListener('click', () => this.selectLocationOnMap());
        }
    }

    showModal(modal) {
        modal.style.display = 'block';
    }

    hideModal(modal) {
        modal.style.display = 'none';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }

    handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Versuche zuerst mit fetch (für moderne Browser)
        fetch('https://parking4free-backend.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('Login erfolgreich, User-Daten:', data);
            this.currentUser = data.user;
            localStorage.setItem('token', data.token);
            this.updateAuthUI();
            this.hideModal(document.getElementById('login-modal'));
            this.showNotification('Erfolgreich angemeldet!', 'success');
        })
        .catch(error => {
            // Fallback: XMLHttpRequest
            this.handleLoginXHR(email, password);
        });
    }

    handleLoginXHR(email, password) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://parking4free-backend.onrender.com/api/auth/login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    this.currentUser = data.user;
                    localStorage.setItem('token', data.token);
                    this.updateAuthUI();
                    this.hideModal(document.getElementById('login-modal'));
                    this.showNotification('Erfolgreich angemeldet!', 'success');
                } catch (error) {
                    this.showNotification('Fehler beim Parsen der Antwort', 'error');
                }
            } else {
                this.showNotification('Login fehlgeschlagen: ' + xhr.status, 'error');
            }
        };
        
        xhr.onerror = (error) => {
            this.showNotification('Verbindungsfehler - Backend nicht erreichbar', 'error');
        };
        
        xhr.ontimeout = () => {
            this.showNotification('Zeitüberschreitung', 'error');
        };
        
        xhr.timeout = 15000; // 15 Sekunden Timeout
        xhr.send(JSON.stringify({ email, password }));
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            this.showNotification('Passwörter stimmen nicht überein', 'error');
            return;
        }

        // Verwende XMLHttpRequest statt fetch um CSP-Probleme zu umgehen
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://parking4free-backend.onrender.com/api/auth/register', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
            if (xhr.status === 201 || xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    this.hideModal(document.getElementById('register-modal'));
                    this.showNotification('Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
                } catch (error) {
                    this.showNotification('Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
                }
            } else {
                try {
                    const data = JSON.parse(xhr.responseText);
                    this.showNotification(data.message || 'Registrierung fehlgeschlagen', 'error');
                } catch (error) {
                    this.showNotification('Registrierung fehlgeschlagen: ' + xhr.status, 'error');
                }
            }
        };
        
        xhr.onerror = () => {
            this.showNotification('Verbindungsfehler', 'error');
        };
        
        xhr.send(JSON.stringify({ name, email, password }));
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Verwende XMLHttpRequest statt fetch um CSP-Probleme zu umgehen
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://parking4free-backend.onrender.com/api/auth/me', true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    this.currentUser = data.user;
                    this.updateAuthUI();
                } catch (error) {
                    localStorage.removeItem('token');
                }
            } else {
                localStorage.removeItem('token');
            }
        };
        
        xhr.onerror = () => {
            localStorage.removeItem('token');
        };
        
        xhr.send();
    }

    updateAuthUI() {
        console.log('updateAuthUI aufgerufen, currentUser:', this.currentUser);
        const userActions = document.getElementById('user-actions');
        const userProfile = document.getElementById('user-profile');
        const username = document.getElementById('username');
        const memberNav = document.querySelector('[data-section="member"]');
        const reportParkingBtn = document.getElementById('report-parking-btn');
        const mapClickHint = document.getElementById('map-click-hint');

        if (this.currentUser) {
            console.log('Benutzer ist eingeloggt:', this.currentUser.name);
            userActions.style.display = 'none';
            userProfile.style.display = 'flex';
            username.textContent = this.currentUser.name;
            
            // Parkplatz melden Button anzeigen
            if (reportParkingBtn) {
                reportParkingBtn.style.display = 'inline-block';
                console.log('Report Parking Button angezeigt');
            }
            
            // Karten-Klick-Hinweis anzeigen
            if (mapClickHint) {
                mapClickHint.style.display = 'block';
                console.log('Map Click Hint angezeigt');
            }
            
            // Mitgliederbereich-Navigation anzeigen
            if (memberNav) {
                memberNav.style.display = 'block';
                memberNav.classList.add('show');
            }
            
            // Mitgliederbereich-Daten laden
            this.loadMemberData();
        } else {
            console.log('Benutzer ist nicht eingeloggt');
            userActions.style.display = 'flex';
            userProfile.style.display = 'none';
            
            // Parkplatz melden Button verstecken
            if (reportParkingBtn) {
                reportParkingBtn.style.display = 'none';
            }
            
            // Karten-Klick-Hinweis verstecken
            if (mapClickHint) {
                mapClickHint.style.display = 'none';
            }
            
            // Mitgliederbereich-Navigation verstecken
            if (memberNav) {
                memberNav.style.display = 'none';
                memberNav.classList.remove('show');
            }
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('token');
        this.updateAuthUI();
        this.showNotification('Erfolgreich abgemeldet', 'success');
    }

    // Parkplatz Melden Funktionen
    useCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.setSelectedCoordinates(lat, lng);
                    this.showNotification('Aktueller Standort verwendet', 'success');
                },
                (error) => {
                    this.showNotification('Standort konnte nicht ermittelt werden', 'error');
                }
            );
        } else {
            this.showNotification('Geolocation wird nicht unterstützt', 'error');
        }
    }

    selectLocationOnMap() {
        this.showNotification('Klicken Sie auf die Karte, um einen Standort zu markieren', 'info');
        
        // Temporären Marker hinzufügen
        this.tempMarker = null;
        
        const onMapClick = (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Bestehenden temporären Marker entfernen
            if (this.tempMarker) {
                this.homeMap.removeLayer(this.tempMarker);
            }
            
            // Neuen temporären Marker hinzufügen
            this.tempMarker = L.circleMarker([lat, lng], {
                radius: 12,
                fillColor: '#ff0000',
                color: '#ffffff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.homeMap);

            // Popup mit Bestätigung hinzufügen
            this.tempMarker.bindPopup(`
                <div style="text-align: center; min-width: 200px;">
                    <h3 style="color: #ff0000; margin: 0 0 10px 0;">📍 Standort markiert!</h3>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>Koordinaten:</strong><br>
                        ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </p>
                    <button onclick="app.confirmLocation()" 
                            style="background: #4ade80; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-weight: bold;">
                        ✅ Bestätigen
                    </button>
                </div>
            `).openPopup();
            
            this.setSelectedCoordinates(lat, lng);
            this.showNotification('Standort auf Karte markiert - Klicken Sie "Bestätigen"', 'success');
            
            // Event Listener entfernen
            this.homeMap.off('click', onMapClick);
        };
        
        this.homeMap.on('click', onMapClick);
    }

    confirmLocation() {
        if (this.tempMarker) {
            this.tempMarker.closePopup();
            this.showNotification('Standort bestätigt! Füllen Sie das Formular aus.', 'success');
        }
    }

    setSelectedCoordinates(lat, lng) {
        const coordinatesDisplay = document.getElementById('selected-coordinates');
        if (coordinatesDisplay) {
            coordinatesDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            coordinatesDisplay.classList.add('active');
            this.selectedCoordinates = { lat, lng };
        }
    }

    handleParkingReport() {
        if (!this.currentUser) {
            this.showNotification('Bitte melden Sie sich an, um einen Parkplatz zu melden', 'error');
            return;
        }

        if (!this.selectedCoordinates) {
            this.showNotification('Bitte wählen Sie einen Standort aus', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('parking-name').value,
            description: document.getElementById('parking-description').value,
            type: document.getElementById('parking-type').value,
            restrictions: document.getElementById('parking-restrictions').value,
            latitude: this.selectedCoordinates.lat,
            longitude: this.selectedCoordinates.lng,
            photo: null // Foto wird später implementiert
        };

        // Validierung
        if (!formData.name || !formData.type) {
            this.showNotification('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }

        // Parkplatz an Backend senden
        fetch(`${this.apiBaseUrl}/reported-parking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.message) {
                this.showNotification(data.message, 'success');
                this.hideModal(document.getElementById('report-parking-modal'));
                this.loadReportedParkingSpots(); // Karte aktualisieren
                this.loadUserStats(); // Statistiken aktualisieren
            } else {
                this.showNotification('Fehler beim Melden des Parkplatzes', 'error');
            }
        })
        .catch(error => {
            console.error('Fehler beim Melden des Parkplatzes:', error);
            // Fallback: Lokal speichern für Demo-Zwecke
            this.saveParkingSpotLocally(formData);
            this.showNotification('Parkplatz lokal gespeichert (Backend nicht erreichbar)', 'warning');
            this.hideModal(document.getElementById('report-parking-modal'));
        });
    }

    saveParkingSpotLocally(formData) {
        // Lokale Speicherung für Demo-Zwecke
        const localSpots = JSON.parse(localStorage.getItem('localParkingSpots') || '[]');
        const newSpot = {
            ...formData,
            id: Date.now(),
            reporter_name: this.currentUser.name,
            created_at: new Date().toISOString(),
            status: 'pending'
        };
        localSpots.push(newSpot);
        localStorage.setItem('localParkingSpots', JSON.stringify(localSpots));
        
        // Karte mit lokalem Spot aktualisieren
        this.displayReportedParkingSpots(localSpots);
    }

    generateSampleData() {
        return []; // Keine Beispieldaten mehr - nur gemeldete Parkplätze werden angezeigt
    }

    // Mitgliederbereich-Funktionen
    loadMemberData() {
        if (!this.currentUser) return;
        
        // Profildaten anzeigen
        document.getElementById('member-name').textContent = this.currentUser.name;
        document.getElementById('member-email').textContent = this.currentUser.email;
        document.getElementById('member-since').textContent = new Date(this.currentUser.created_at).toLocaleDateString('de-DE');
        document.getElementById('member-role').textContent = this.currentUser.role === 'admin' ? 'Administrator' : 'Benutzer';
        
        // Statistiken laden
        this.loadUserStats();
        
        // Favoriten laden
        this.loadFavorites();
        
        // Einstellungen laden
        this.loadSettings();
        
        // Rangliste laden
        loadLeaderboard();
    }

    loadUserStats() {
        if (!this.currentUser) return;

        // Statistiken vom Backend laden
        fetch(`${this.apiBaseUrl}/statistics/user/${this.currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(stats => {
            document.getElementById('stats-searches').textContent = stats.searches || 0;
            document.getElementById('stats-favorites').textContent = stats.favorites || 0;
            document.getElementById('stats-reports').textContent = stats.reports || 0;
            document.getElementById('stats-points').textContent = stats.points || 0;
            document.getElementById('total-points').textContent = stats.points || 0;
            
            // Rangliste berechnen
            const rank = this.calculateRank(stats.points || 0);
            document.getElementById('user-rank').textContent = rank;
        })
        .catch(error => {
            console.error('Fehler beim Laden der Statistiken:', error);
            // Fallback zu Standardwerten
            document.getElementById('stats-searches').textContent = 0;
            document.getElementById('stats-favorites').textContent = 0;
            document.getElementById('stats-reports').textContent = 0;
            document.getElementById('stats-points').textContent = 0;
            document.getElementById('total-points').textContent = 0;
            document.getElementById('user-rank').textContent = 'Unranked';
        });
    }

    calculateRank(points) {
        if (points === 0) return 'Unranked';
        if (points < 50) return 'Bronze';
        if (points < 100) return 'Silber';
        if (points < 200) return 'Gold';
        if (points < 500) return 'Platin';
        return 'Diamond';
    }

    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('userFavorites') || '[]');
        const favoritesList = document.getElementById('favorites-list');
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="no-favorites">Noch keine Favoriten gespeichert</p>';
        } else {
            favoritesList.innerHTML = favorites.map(fav => `
                <div class="favorite-item">
                    <h4>${fav.name}</h4>
                    <p>${fav.address}</p>
                    <p><strong>Typ:</strong> ${fav.type}</p>
                </div>
            `).join('');
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        document.getElementById('email-notifications').checked = settings.emailNotifications || false;
        document.getElementById('auto-save-favorites').checked = settings.autoSaveFavorites || false;
        document.getElementById('dark-mode').checked = settings.darkMode || false;
    }

    // Event Listeners für Mitgliederbereich
    setupMemberEventListeners() {
        // Parkplatz melden Form
        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitParkingReport();
            });
        }
        
        // Parkplatz-Typ Änderung
        const reportType = document.getElementById('report-type');
        if (reportType) {
            reportType.addEventListener('change', (e) => {
                const timeRestrictionsGroup = document.getElementById('time-restrictions-group');
                if (e.target.value === 'time-limited' || e.target.value === 'parking-disc') {
                    timeRestrictionsGroup.style.display = 'block';
                } else {
                    timeRestrictionsGroup.style.display = 'none';
                }
            });
        }
        
        // Foto-Upload
        const photoInput = document.getElementById('report-photo');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('photo-preview').innerHTML = `
                            <img src="${e.target.result}" alt="Parkplatz Foto">
                        `;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Standort markieren Button
        const selectLocationBtn = document.getElementById('select-location-btn');
        if (selectLocationBtn) {
            selectLocationBtn.addEventListener('click', () => {
                this.selectLocationOnMap();
            });
        }
    }

    selectLocationOnMap() {
        // Geofencing/Standort-Auswahl
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    document.getElementById('selected-coordinates').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    this.showNotification('Standort erfolgreich markiert!', 'success');
                },
                (error) => {
                    // Fallback: Demo-Koordinaten
                    const demoLat = 52.5200 + (Math.random() - 0.5) * 0.01;
                    const demoLng = 13.4050 + (Math.random() - 0.5) * 0.01;
                    document.getElementById('selected-coordinates').textContent = `${demoLat.toFixed(6)}, ${demoLng.toFixed(6)}`;
                    this.showNotification('Demo-Standort markiert (GPS nicht verfügbar)', 'info');
                }
            );
        } else {
            // Fallback für Browser ohne Geolocation
            const demoLat = 52.5200 + (Math.random() - 0.5) * 0.01;
            const demoLng = 13.4050 + (Math.random() - 0.5) * 0.01;
            document.getElementById('selected-coordinates').textContent = `${demoLat.toFixed(6)}, ${demoLng.toFixed(6)}`;
            this.showNotification('Demo-Standort markiert', 'info');
        }
    }

    submitParkingReport() {
        const address = document.getElementById('report-address').value;
        const type = document.getElementById('report-type').value;
        const description = document.getElementById('report-description').value;
        const photoFile = document.getElementById('report-photo').files[0];
        const coordinates = document.getElementById('selected-coordinates').textContent;
        
        if (!address || !type || !photoFile) {
            this.showNotification('Bitte füllen Sie alle Pflichtfelder aus (inkl. Foto)', 'error');
            return;
        }
        
        if (coordinates === 'Noch nicht markiert') {
            this.showNotification('Bitte markieren Sie den Standort auf der Karte', 'error');
            return;
        }
        
        // Zeitliche Einschränkungen sammeln
        let timeRestrictions = null;
        if (type === 'time-limited' || type === 'parking-disc') {
            const timeFrom = document.getElementById('time-from').value;
            const timeTo = document.getElementById('time-to').value;
            const selectedDays = Array.from(document.querySelectorAll('.days-row input:checked')).map(cb => cb.value);
            
            if (timeFrom && timeTo && selectedDays.length > 0) {
                timeRestrictions = {
                    from: timeFrom,
                    to: timeTo,
                    days: selectedDays
                };
            }
        }
        
        // Report an Backend senden (hier würde die API-Integration erfolgen)
        const report = {
            address,
            type,
            description,
            coordinates,
            timeRestrictions,
            photoFile: photoFile.name, // In echtem System würde das Foto hochgeladen
            userId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            status: 'pending' // Wartet auf Überprüfung
        };
        
        // Lokal speichern (für Demo-Zwecke)
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(report);
        localStorage.setItem('userReports', JSON.stringify(reports));
        
        // Statistiken und Punkte aktualisieren
        const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        stats.reports = (stats.reports || 0) + 1;
        stats.points = (stats.points || 0) + 10; // 10 Punkte pro Meldung
        localStorage.setItem('userStats', JSON.stringify(stats));
        
        this.loadUserStats();
        this.showNotification('Parkplatz erfolgreich gemeldet! +10 Punkte erhalten!', 'success');
        
        // Neuen Marker zur Karte hinzufügen
        this.addReportedSpotToMap(report);
        
        // Form zurücksetzen
        document.getElementById('report-form').reset();
        document.getElementById('photo-preview').innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">📸</span>
                <p>Foto aufnehmen oder auswählen</p>
                <p class="upload-hint">Parkplatz und Schild müssen sichtbar sein</p>
            </div>
        `;
        document.getElementById('selected-coordinates').textContent = 'Noch nicht markiert';
        document.getElementById('time-restrictions-group').style.display = 'none';
    }
}

// CSS für Benachrichtigungen hinzufügen
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// App initialisieren wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FreeParkApp();
});

// Globale Funktionen für Mitgliederbereich
function editProfile() {
    alert('Profil-Bearbeitung wird in einer zukünftigen Version verfügbar sein.');
}

function addToFavorites() {
    alert('Favoriten-Funktion wird in einer zukünftigen Version verfügbar sein.');
}

function saveSettings() {
    const settings = {
        emailNotifications: document.getElementById('email-notifications').checked,
        autoSaveFavorites: document.getElementById('auto-save-favorites').checked,
        darkMode: document.getElementById('dark-mode').checked
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    app.showNotification('Einstellungen gespeichert!', 'success');
}

function loadLeaderboard() {
    const currentUser = app.currentUser;
    
    // Rangliste vom Backend laden
    fetch(`${app.apiBaseUrl}/statistics/leaderboard`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(users => {
            const leaderboardList = document.getElementById('leaderboard-list');
            
            // Sicherstellen, dass users ein Array ist
            const userArray = Array.isArray(users) ? users : [];
            
            if (userArray.length === 0) {
                leaderboardList.innerHTML = '<p class="loading-leaderboard">Keine Daten verfügbar</p>';
            } else {
                leaderboardList.innerHTML = userArray.map((user, index) => {
                    const rank = index + 1;
                    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    
                    return `
                        <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                            <div class="leaderboard-rank">
                                <div class="rank-number ${rankClass}">${rank}</div>
                                <div class="user-info">
                                    <div class="user-name">${user.name}</div>
                                    <div class="user-points">${user.reports} Parkplätze gemeldet</div>
                                </div>
                            </div>
                            <div class="user-points">${user.points} Punkte</div>
                        </div>
                    `;
                }).join('');
            }
            
            // Benutzer-Position anzeigen
            const userPositionInfo = document.getElementById('user-position-info');
            if (currentUser) {
                fetch(`${app.apiBaseUrl}/statistics/user/${currentUser.id}/position`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    userPositionInfo.innerHTML = `
                        <p><strong>Rang:</strong> ${data.position}</p>
                        <p><strong>Punkte:</strong> ${currentUser.points || 0}</p>
                        <p><strong>Gemeldete Parkplätze:</strong> ${currentUser.reports || 0}</p>
                    `;
                })
                .catch(error => {
                    console.error('Fehler beim Laden der Benutzer-Position:', error);
                    userPositionInfo.innerHTML = '<p>Position konnte nicht geladen werden</p>';
                });
            } else {
                userPositionInfo.innerHTML = '<p>Bitte einloggen um Ihre Position zu sehen</p>';
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden der Rangliste:', error);
            const leaderboardList = document.getElementById('leaderboard-list');
            leaderboardList.innerHTML = '<p class="loading-leaderboard">Fehler beim Laden der Rangliste</p>';
        });
}

// Service Worker für PWA-Funktionalität (optional)
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('SW registered: ', registration);
//             })
//             .catch(registrationError => {
//                 console.log('SW registration failed: ', registrationError);
//             });
//     });
// }
