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

        // Beispieldaten werden später in init() hinzugefügt
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
        // Gemeldete Parkplätze aus localStorage laden
        const reportedSpots = JSON.parse(localStorage.getItem('userReports') || '[]');
        
        if (reportedSpots.length === 0) return;
        
        // Marker für gemeldete Parkplätze hinzufügen
        reportedSpots.forEach(spot => {
            if (spot.coordinates && spot.coordinates !== 'Noch nicht markiert') {
                const [lat, lng] = spot.coordinates.split(', ').map(coord => parseFloat(coord));
                
                if (!isNaN(lat) && !isNaN(lng)) {
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
                            <p><strong>Adresse:</strong> ${spot.address}</p>
                            <p><strong>Typ:</strong> ${this.getReportedTypeLabel(spot.type)}</p>
                            <p><strong>Gemeldet von:</strong> ${spot.userId}</p>
                            <p><strong>Datum:</strong> ${new Date(spot.timestamp).toLocaleDateString('de-DE')}</p>
                            ${spot.description ? `<p><strong>Beschreibung:</strong> ${spot.description}</p>` : ''}
                            ${spot.timeRestrictions ? `<p><strong>Zeitliche Einschränkungen:</strong> ${this.formatTimeRestrictions(spot.timeRestrictions)}</p>` : ''}
                            <div style="margin-top: 10px; padding: 5px; background: #1a1a1a; border-radius: 3px;">
                                <small style="color: #888888;">Status: ${spot.status === 'pending' ? '⏳ Wartet auf Überprüfung' : '✅ Bestätigt'}</small>
                            </div>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    
                    // Marker zur Karte hinzufügen
                    if (this.map) {
                        marker.addTo(this.map);
                    }
                    
                    // Marker zur Liste hinzufügen für späteres Management
                    if (!this.reportedMarkers) {
                        this.reportedMarkers = [];
                    }
                    this.reportedMarkers.push(marker);
                }
            }
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

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) this.hideModal(loginModal);
            if (e.target === registerModal) this.hideModal(registerModal);
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
        const userActions = document.getElementById('user-actions');
        const userProfile = document.getElementById('user-profile');
        const username = document.getElementById('username');
        const memberNav = document.querySelector('[data-section="member"]');

        if (this.currentUser) {
            userActions.style.display = 'none';
            userProfile.style.display = 'flex';
            username.textContent = this.currentUser.name;
            
            // Mitgliederbereich-Navigation anzeigen
            if (memberNav) {
                memberNav.style.display = 'block';
                memberNav.classList.add('show');
            }
            
            // Mitgliederbereich-Daten laden
            this.loadMemberData();
        } else {
            userActions.style.display = 'flex';
            userProfile.style.display = 'none';
            
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
        // Statistiken aus localStorage laden oder Standardwerte verwenden
        const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        
        document.getElementById('stats-searches').textContent = stats.searches || 0;
        document.getElementById('stats-favorites').textContent = stats.favorites || 0;
        document.getElementById('stats-reports').textContent = stats.reports || 0;
        document.getElementById('stats-points').textContent = stats.points || 0;
        document.getElementById('total-points').textContent = stats.points || 0;
        
        // Rangliste berechnen (Demo)
        const rank = this.calculateRank(stats.points || 0);
        document.getElementById('user-rank').textContent = rank;
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
    // Alle Benutzer mit Punkten sammeln
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const currentUser = app.currentUser;
    
    // Demo-Benutzer hinzufügen falls keine vorhanden
    if (allUsers.length === 0) {
        const demoUsers = [
            { id: 'user1', name: 'Max', points: 150, reports: 15 },
            { id: 'user2', name: 'Anna', points: 120, reports: 12 },
            { id: 'user3', name: 'Tom', points: 90, reports: 9 },
            { id: 'user4', name: 'Lisa', points: 80, reports: 8 },
            { id: 'user5', name: 'Paul', points: 70, reports: 7 },
            { id: 'user6', name: 'Sarah', points: 60, reports: 6 },
            { id: 'user7', name: 'Felix', points: 50, reports: 5 },
            { id: 'user8', name: 'Emma', points: 40, reports: 4 },
            { id: 'user9', name: 'Lukas', points: 30, reports: 3 },
            { id: 'user10', name: 'Julia', points: 20, reports: 2 }
        ];
        localStorage.setItem('allUsers', JSON.stringify(demoUsers));
    }
    
    // Aktuelle Benutzer laden
    const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
    
    // Aktuellen Benutzer hinzufügen falls nicht vorhanden
    if (currentUser && !users.find(u => u.id === currentUser.id)) {
        const userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
        users.push({
            id: currentUser.id,
            name: currentUser.name.split(' ')[0], // Nur Vorname
            points: userStats.points || 0,
            reports: userStats.reports || 0
        });
        localStorage.setItem('allUsers', JSON.stringify(users));
    }
    
    // Nach Punkten sortieren (absteigend)
    users.sort((a, b) => b.points - a.points);
    
    // Top 10 anzeigen
    const top10 = users.slice(0, 10);
    const leaderboardList = document.getElementById('leaderboard-list');
    
    if (top10.length === 0) {
        leaderboardList.innerHTML = '<p class="loading-leaderboard">Keine Daten verfügbar</p>';
    } else {
        leaderboardList.innerHTML = top10.map((user, index) => {
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
        const userRank = users.findIndex(u => u.id === currentUser.id) + 1;
        const userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
        
        if (userRank > 0) {
            userPositionInfo.innerHTML = `
                <p><strong>Rang:</strong> ${userRank} von ${users.length}</p>
                <p><strong>Punkte:</strong> ${userStats.points || 0}</p>
                <p><strong>Gemeldete Parkplätze:</strong> ${userStats.reports || 0}</p>
            `;
        } else {
            userPositionInfo.innerHTML = '<p>Noch keine Punkte gesammelt</p>';
        }
    } else {
        userPositionInfo.innerHTML = '<p>Bitte einloggen um Ihre Position zu sehen</p>';
    }
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
