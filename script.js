// FreePark v2 - JavaScript Funktionalität

class FreeParkApp {
    constructor() {
        this.map = null;
        this.homeMap = null;
        this.markers = [];
        this.homeMarkers = [];
        this.currentSection = 'home';
        this.parkingData = this.generateSampleData();
        this.currentUser = null;
        this.apiBaseUrl = window.Parking4FreeConfig?.apiBaseUrl || 'http://localhost:3000/api';
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupMap();
        this.setupHomeMap();
        this.setupEventListeners();
        this.setupAuth();
        this.setupMemberEventListeners();
        this.loadParkingList();
        this.checkAuthStatus();
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

        // Beispieldaten auf der Karte anzeigen
        this.addSampleMarkers();
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

        // Beispieldaten auf der Home-Karte anzeigen
        this.addHomeMapMarkers();
    }

    addHomeMapMarkers() {
        const sampleLocations = [
            { name: 'Berlin - Alexanderplatz', lat: 52.5219, lng: 13.4132, type: 'free', available: true },
            { name: 'Hamburg - Rathaus', lat: 53.5511, lng: 9.9937, type: 'paid', available: true },
            { name: 'München - Marienplatz', lat: 48.1372, lng: 11.5755, type: 'time-limited', available: false },
            { name: 'Köln - Dom', lat: 50.9375, lng: 6.9603, type: 'free', available: true },
            { name: 'Frankfurt - Hauptbahnhof', lat: 50.1109, lng: 8.6821, type: 'paid', available: true },
            { name: 'Stuttgart - Schlossplatz', lat: 48.7758, lng: 9.1829, type: 'free', available: true },
            { name: 'Düsseldorf - Altstadt', lat: 51.2277, lng: 6.7735, type: 'time-limited', available: true },
            { name: 'Dortmund - Westfalenpark', lat: 51.5136, lng: 7.4653, type: 'free', available: true }
        ];

        sampleLocations.forEach(location => {
            const markerColor = this.getMarkerColor(location.type, location.available);
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 6,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.homeMap);

            const popupContent = `
                <div style="text-align: center; min-width: 180px;">
                    <h3 style="margin: 0 0 8px 0; color: #00ff00; font-size: 14px;">${location.name}</h3>
                    <p style="margin: 3px 0; color: #333; font-size: 12px;">
                        <strong>Typ:</strong> ${this.getTypeLabel(location.type)}<br>
                        <strong>Status:</strong> ${location.available ? 'Verfügbar' : 'Besetzt'}<br>
                        <strong>Preis:</strong> ${this.getPriceLabel(location.type)}
                    </p>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.homeMarkers.push(marker);
        });
    }

    addSampleMarkers() {
        const sampleLocations = [
            { name: 'Berlin - Alexanderplatz', lat: 52.5219, lng: 13.4132, type: 'free', available: true },
            { name: 'Hamburg - Rathaus', lat: 53.5511, lng: 9.9937, type: 'paid', available: true },
            { name: 'München - Marienplatz', lat: 48.1372, lng: 11.5755, type: 'time-limited', available: false },
            { name: 'Köln - Dom', lat: 50.9375, lng: 6.9603, type: 'free', available: true },
            { name: 'Frankfurt - Hauptbahnhof', lat: 50.1109, lng: 8.6821, type: 'paid', available: true },
            { name: 'Stuttgart - Schlossplatz', lat: 48.7758, lng: 9.1829, type: 'free', available: true },
            { name: 'Düsseldorf - Altstadt', lat: 51.2277, lng: 6.7735, type: 'time-limited', available: true },
            { name: 'Dortmund - Westfalenpark', lat: 51.5136, lng: 7.4653, type: 'free', available: true }
        ];

        sampleLocations.forEach(location => {
            const markerColor = this.getMarkerColor(location.type, location.available);
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 8,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            const popupContent = `
                <div style="text-align: center; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #00ff00;">${location.name}</h3>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>Typ:</strong> ${this.getTypeLabel(location.type)}<br>
                        <strong>Status:</strong> ${location.available ? 'Verfügbar' : 'Besetzt'}<br>
                        <strong>Preis:</strong> ${this.getPriceLabel(location.type)}
                    </p>
                    <button onclick="app.showDirections(${location.lat}, ${location.lng})" 
                            style="background: #00ff00; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-weight: bold;">
                        Route anzeigen
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.markers.push(marker);
        });
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
        // Postleitzahl-Suche
        const postalSearchBtn = document.getElementById('postal-search-btn');
        const postalSearch = document.getElementById('postal-search');
        
        if (postalSearchBtn && postalSearch) {
            postalSearchBtn.addEventListener('click', () => {
                this.searchByPostalCode(postalSearch.value);
            });
            
            postalSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchByPostalCode(postalSearch.value);
                }
            });

            // Nur Zahlen erlauben
            postalSearch.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

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

    searchByPostalCode(postalCode) {
        if (!postalCode.trim() || postalCode.length !== 5) {
            this.showNotification('Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.', 'warning');
            return;
        }

        // Deutsche Postleitzahlen-Mapping (Beispiele)
        const postalCodeMap = {
            '10115': [52.5200, 13.4050, 'Berlin-Mitte'],
            '20095': [53.5511, 9.9937, 'Hamburg-Altstadt'],
            '80331': [48.1351, 11.5820, 'München-Altstadt'],
            '50667': [50.9375, 6.9603, 'Köln-Altstadt'],
            '60311': [50.1109, 8.6821, 'Frankfurt-Altstadt'],
            '70173': [48.7758, 9.1829, 'Stuttgart-Altstadt'],
            '40213': [51.2277, 6.7735, 'Düsseldorf-Altstadt'],
            '44135': [51.5136, 7.4653, 'Dortmund-Altstadt'],
            '10117': [52.5200, 13.4050, 'Berlin-Mitte'],
            '10119': [52.5200, 13.4050, 'Berlin-Mitte'],
            '10178': [52.5200, 13.4050, 'Berlin-Mitte'],
            '10179': [52.5200, 13.4050, 'Berlin-Mitte'],
            '20097': [53.5511, 9.9937, 'Hamburg-Altstadt'],
            '20099': [53.5511, 9.9937, 'Hamburg-Altstadt'],
            '80335': [48.1351, 11.5820, 'München-Altstadt'],
            '80339': [48.1351, 11.5820, 'München-Altstadt'],
            '50668': [50.9375, 6.9603, 'Köln-Altstadt'],
            '50670': [50.9375, 6.9603, 'Köln-Altstadt'],
            '60312': [50.1109, 8.6821, 'Frankfurt-Altstadt'],
            '60313': [50.1109, 8.6821, 'Frankfurt-Altstadt'],
            '70174': [48.7758, 9.1829, 'Stuttgart-Altstadt'],
            '70176': [48.7758, 9.1829, 'Stuttgart-Altstadt'],
            '40210': [51.2277, 6.7735, 'Düsseldorf-Altstadt'],
            '40211': [51.2277, 6.7735, 'Düsseldorf-Altstadt'],
            '44137': [51.5136, 7.4653, 'Dortmund-Altstadt'],
            '44139': [51.5136, 7.4653, 'Dortmund-Altstadt']
        };

        const location = postalCodeMap[postalCode];
        
        if (location) {
            const [lat, lng, cityName] = location;
            this.homeMap.setView([lat, lng], 13);
            this.showNotification(`Gefunden: ${cityName} (${postalCode})`, 'success');
            
            // Markierung für die gesuchte Postleitzahl hinzufügen
            this.addPostalCodeMarker(lat, lng, cityName, postalCode);
        } else {
            // Fallback: Deutschland Zentrum
            this.homeMap.setView([51.1657, 10.4515], 6);
            this.showNotification(`Postleitzahl ${postalCode} nicht gefunden. Zeige Deutschland-Übersicht.`, 'warning');
        }
    }

    addPostalCodeMarker(lat, lng, cityName, postalCode) {
        // Bestehende Postleitzahl-Marker entfernen
        this.homeMarkers.forEach(marker => {
            if (marker.isPostalCodeMarker) {
                this.homeMap.removeLayer(marker);
            }
        });

        // Neuen Marker hinzufügen
        const marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: '#ff0000',
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.homeMap);

        marker.isPostalCodeMarker = true;

        const popupContent = `
            <div style="text-align: center; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #ff0000; font-size: 16px;">📍 ${cityName}</h3>
                <p style="margin: 3px 0; color: #333; font-size: 14px;">
                    <strong>Postleitzahl:</strong> ${postalCode}<br>
                    <strong>Status:</strong> Suche nach Parkplätzen...
                </p>
            </div>
        `;

        marker.bindPopup(popupContent);
        marker.openPopup();
        this.homeMarkers.push(marker);
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
        // Login Modal
        const loginBtn = document.getElementById('login-btn');
        const loginModal = document.getElementById('login-modal');
        const closeLogin = document.getElementById('close-login');
        const loginForm = document.getElementById('login-form');

        // Register Modal
        const registerBtn = document.getElementById('register-btn');
        const registerModal = document.getElementById('register-modal');
        const closeRegister = document.getElementById('close-register');
        const registerForm = document.getElementById('register-form');

        // Logout
        const logoutBtn = document.getElementById('logout-btn');

        // Event Listeners
        loginBtn.addEventListener('click', () => this.showModal(loginModal));
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
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

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
        const memberNav = document.querySelector('.member-only');

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
        return [
            {
                name: 'Parkplatz Alexanderplatz',
                address: 'Alexanderplatz 1, 10178 Berlin',
                city: 'Berlin',
                type: 'paid',
                available: true
            },
            {
                name: 'Kostenloser Parkplatz Tiergarten',
                address: 'Straße des 17. Juni, 10557 Berlin',
                city: 'Berlin',
                type: 'free',
                available: true
            },
            {
                name: 'Parkhaus Rathaus Hamburg',
                address: 'Rathausmarkt 1, 20095 Hamburg',
                city: 'Hamburg',
                type: 'paid',
                available: false
            },
            {
                name: 'Straßenparken St. Pauli',
                address: 'Reeperbahn 1, 20359 Hamburg',
                city: 'Hamburg',
                type: 'time-limited',
                available: true
            },
            {
                name: 'Parkplatz Marienplatz',
                address: 'Marienplatz 1, 80331 München',
                city: 'München',
                type: 'paid',
                available: true
            },
            {
                name: 'Kostenloser Parkplatz Olympiapark',
                address: 'Spiridon-Louis-Ring 21, 80809 München',
                city: 'München',
                type: 'free',
                available: true
            },
            {
                name: 'Parkhaus Dom Köln',
                address: 'Domkloster 4, 50667 Köln',
                city: 'Köln',
                type: 'paid',
                available: true
            },
            {
                name: 'Straßenparken Altstadt',
                address: 'Hohe Straße 1, 50667 Köln',
                city: 'Köln',
                type: 'time-limited',
                available: false
            }
        ];
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
    }

    loadUserStats() {
        // Statistiken aus localStorage laden oder Standardwerte verwenden
        const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        
        document.getElementById('stats-searches').textContent = stats.searches || 0;
        document.getElementById('stats-favorites').textContent = stats.favorites || 0;
        document.getElementById('stats-reports').textContent = stats.reports || 0;
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
    }

    submitParkingReport() {
        const address = document.getElementById('report-address').value;
        const type = document.getElementById('report-type').value;
        const description = document.getElementById('report-description').value;
        
        if (!address || !type) {
            this.showNotification('Bitte füllen Sie alle Pflichtfelder aus', 'error');
            return;
        }
        
        // Report an Backend senden (hier würde die API-Integration erfolgen)
        const report = {
            address,
            type,
            description,
            userId: this.currentUser.id,
            timestamp: new Date().toISOString()
        };
        
        // Lokal speichern (für Demo-Zwecke)
        const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
        reports.push(report);
        localStorage.setItem('userReports', JSON.stringify(reports));
        
        // Statistiken aktualisieren
        const stats = JSON.parse(localStorage.getItem('userStats') || '{}');
        stats.reports = (stats.reports || 0) + 1;
        localStorage.setItem('userStats', JSON.stringify(stats));
        
        this.loadUserStats();
        this.showNotification('Parkplatz erfolgreich gemeldet!', 'success');
        
        // Form zurücksetzen
        document.getElementById('report-form').reset();
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
