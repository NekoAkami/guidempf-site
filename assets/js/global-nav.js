// ========================================
// NAVIGATION GLOBALE - MPF COMBINE TERMINAL
// ========================================

// --- Anti-FOUT : preconnect + masquer body jusqu'au chargement des polices ---
(function() {
    // Preconnect pour accélérer le chargement des polices Google
    ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].forEach(function(href) {
        if (!document.querySelector('link[href="' + href + '"]')) {
            var l = document.createElement('link');
            l.rel = 'preconnect';
            l.href = href;
            if (href.includes('gstatic')) l.crossOrigin = 'anonymous';
            document.head.appendChild(l);
        }
    });
    // Afficher le body dès que les polices sont chargées (ou timeout 1.5s de sécurité)
    function showBody() {
        document.body.classList.add('fonts-ready');
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(showBody);
    } else {
        // Fallback pour navigateurs sans FontFaceSet API
        showBody();
    }
    // Timeout de sécurité : si les polices ne chargent pas en 1.5s, on affiche quand même
    setTimeout(showBody, 1500);
})();

class GlobalNavigation {
    constructor() {
        this.init();
    }

    async init() {
        this.basePath = this.getBasePath();
        this.navOverride = null;
        this.injectFavicon();
        this.injectServerLogo();
        this.injectMissingAssets();

        // 1. Load nav from localStorage cache (synchronous, instant)
        this.loadNavConfigFromCache();

        // 2. Render immediately with cache or hardcoded defaults
        this.createNavigationHTML();
        this.injectSearchBar();
        this.injectBackButton();
        this.markActivePage();
        this.setupMobileMenu();
        this.setupDropdowns();
        this.cleanGlitchText();

        // 3. Background: refresh nav from Firestore + maintenance indicator (non-blocking)
        this.loadNavConfigFromFirestore();
        this.injectMaintenanceIndicator();
    }

    // Synchronous cache read — never blocks rendering
    loadNavConfigFromCache() {
        try {
            const cached = localStorage.getItem('mpf_nav_config');
            const ts = parseInt(localStorage.getItem('mpf_nav_config_ts') || '0');
            if (cached && Date.now() - ts < 10 * 60 * 1000) { // 10 min cache
                const parsed = JSON.parse(cached);
                if (parsed.row1 && parsed.row2) {
                    this.navOverride = parsed;
                }
            }
        } catch {}
    }

    // Async Firestore refresh — runs in background, updates cache for next page load
    async loadNavConfigFromFirestore() {
        try {
            // Wait for auth.js to init Firebase (it's always loaded as a module)
            const authModule = await import(this.basePath + 'assets/js/auth.js');
            const db = authModule.db;
            if (!db) return;

            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const snap = await getDoc(doc(db, 'config', 'navigation'));
            if (snap.exists()) {
                const data = snap.data();
                if (data.row1 && data.row2) {
                    const changed = JSON.stringify(this.navOverride?.row1) !== JSON.stringify(data.row1)
                                 || JSON.stringify(this.navOverride?.row2) !== JSON.stringify(data.row2);
                    this.navOverride = data;
                    localStorage.setItem('mpf_nav_config', JSON.stringify(data));
                    localStorage.setItem('mpf_nav_config_ts', Date.now().toString());
                    // If nav config changed since cache, hot-reload the navigation
                    if (changed) this.refreshNavigation();
                }
            }
        } catch (err) {
            console.warn('Nav config refresh failed:', err.message);
        }
    }

    // Hot-reload navigation without full page refresh
    refreshNavigation() {
        const oldNav = document.querySelector('.main-nav');
        if (oldNav) oldNav.remove();
        this.createNavigationHTML();
        this.markActivePage();
        this.setupMobileMenu();
        this.setupDropdowns();
    }
    async injectMaintenanceIndicator() {
        // Ajoute l'indicateur maintenance/en ligne à côté du compteur en ligne
        if (document.getElementById('maintenanceIndicator')) return;
        let mod;
        try {
            mod = await import(this.basePath + 'assets/js/maintenance.js');
        } catch { return; }
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) return;
        const indicator = document.createElement('div');
        indicator.id = 'maintenanceIndicator';
        indicator.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;margin-left:1.2rem;vertical-align:middle;';
        headerContent.appendChild(indicator);

        function updateInd(data) {
            const enabled = data && data.enabled === true;
            if (enabled) {
                indicator.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffaa00;animation:maintPulse 1.5s ease-in-out infinite;"></span><span style="color:#ffaa00;font-weight:700;font-family:Share Tech Mono,monospace;font-size:0.8rem;">MAINTENANCE</span>';
            } else {
                indicator.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00cc55;"></span><span style="color:#00cc55;font-weight:700;font-family:Share Tech Mono,monospace;font-size:0.8rem;">EN LIGNE</span>';
            }
        }

        // Écoute temps réel au lieu de polling
        mod.listenMaintenanceMode(updateInd);

        // Ajouter l'animation de pulsation
        if (!document.getElementById('maintPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'maintPulseStyle';
            style.textContent = '@keyframes maintPulse{0%,100%{opacity:1;box-shadow:0 0 4px #ffaa00;}50%{opacity:0.4;box-shadow:0 0 8px #ffaa00;}}';
            document.head.appendChild(style);
        }
    }
    // Redirection maintenance globale (hors admin/ et maintenance.html)
    async checkMaintenanceRedirect() {
        const path = window.location.pathname;
        if (path.endsWith('maintenance.html')) return;

        // Import Firebase modules en parallèle (au lieu de séquentiel)
        let initializeApp, getApp, getFirestore, getDoc, doc, getAuth, onAuthStateChanged, signOut;
        try {
            const [appMod, fsMod, authMod] = await Promise.all([
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
            ]);
            initializeApp = appMod.initializeApp;
            getApp = appMod.getApp;
            getFirestore = fsMod.getFirestore;
            getDoc = fsMod.getDoc;
            doc = fsMod.doc;
            getAuth = authMod.getAuth;
            onAuthStateChanged = authMod.onAuthStateChanged;
            signOut = authMod.signOut;
        } catch { return; }

        let app;
        try { app = getApp(); } catch {
            const firebaseConfig = {
                apiKey: "AIzaSyDPs4x2EE1pyeQTC_V-Ze5uyZ8Rs2N8qF4",
                authDomain: "guidempf.firebaseapp.com",
                projectId: "guidempf",
                storageBucket: "guidempf.firebasestorage.app",
                messagingSenderId: "806309770965",
                appId: "1:806309770965:web:3621f58bfb252446c1945c"
            };
            app = initializeApp(firebaseConfig);
        }
        const db = getFirestore(app);
        const auth = getAuth(app);

        // Lire l'état maintenance
        let maintEnabled = false;
        let maintInfo = {};
        try {
            const snap = await getDoc(doc(db, 'config', 'maintenance'));
            if (snap.exists() && snap.data().enabled === true) {
                maintEnabled = true;
                maintInfo = snap.data();
            }
        } catch { return; } // Si on ne peut pas lire, on ne bloque pas

        if (!maintEnabled) return;

        // Pages admin : montrer bannière seulement
        if (path.includes('/admin/')) {
            this.showMaintenanceBanner(maintInfo);
            return;
        }

        // Attendre l'état auth avec un timeout
        const basePath = this.basePath;
        const self = this;
        const user = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 3000);
            onAuthStateChanged(auth, (u) => {
                clearTimeout(timeout);
                resolve(u);
            });
        });

        // Pas connecté → rediriger
        if (!user) {
            window.location.href = basePath + 'maintenance.html';
            return;
        }

        // Lire le profil utilisateur
        let userData = null;
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) userData = snap.data();
        } catch {}

        if (!userData) {
            await signOut(auth);
            window.location.href = basePath + 'maintenance.html';
            return;
        }

        // Admin → laisser passer
        if (userData.is_admin === true) {
            self.showMaintenanceBanner(maintInfo);
            return;
        }

        // Vérifier HG via units.json
        let isHG = false;
        const matricule = userData.matricule || '';
        if (matricule) {
            try {
                const res = await fetch('https://raw.githubusercontent.com/NekoAkami/guidempf-site/main/data/units.json');
                if (res.ok) {
                    const units = await res.json();
                    const unit = units.find(u => u.matricule === matricule);
                    if (unit && (unit.rang === 'Ofc' || unit.rang === 'Cmd')) isHG = true;
                }
            } catch {}
        }

        if (isHG) {
            self.showMaintenanceBanner(maintInfo);
            return;
        }

        // Non admin/HG → déconnecter et rediriger
        await signOut(auth);
        window.location.href = basePath + 'maintenance.html';
    }

    // Bannière d'alerte maintenance pour admins/HG
    showMaintenanceBanner(info) {
        if (document.getElementById('maintBanner')) return;
        const banner = document.createElement('div');
        banner.id = 'maintBanner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:rgba(255,170,0,0.95);color:#000;text-align:center;padding:0.4rem 1rem;font-family:"Share Tech Mono",monospace;font-size:0.78rem;font-weight:700;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;box-shadow:0 2px 10px rgba(255,170,0,0.3);';
        let html = '⚠ MODE MAINTENANCE ACTIF — Les utilisateurs sont redirigés';
        if (info.message) {
            html += ' — <span style="font-weight:400;font-style:italic;">"' + info.message.substring(0, 80) + '"</span>';
        }
        if (info.estimated_return) {
            try {
                const ret = new Date(info.estimated_return);
                if (!isNaN(ret.getTime())) {
                    html += ' — Retour: ' + ret.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
                }
            } catch {}
        }
        html += ' <a href="' + this.basePath + 'admin/panel.html" style="color:#000;text-decoration:underline;margin-left:0.5rem;">Panel Admin</a>';
        html += '<button onclick="this.parentElement.remove()" style="background:none;border:1px solid #000;color:#000;cursor:pointer;padding:0.1rem 0.5rem;font-family:inherit;font-size:0.7rem;border-radius:2px;margin-left:0.5rem;">✕</button>';
        banner.innerHTML = html;
        document.body.prepend(banner);
        // Décaler le contenu de la page
        document.body.style.paddingTop = banner.offsetHeight + 'px';
    }

    // Détecte le chemin de base pour les sous-dossiers (ex: admin/)
    getBasePath() {
        const navScript = document.querySelector('script[src*="global-nav.js"]');
        if (navScript) {
            const src = navScript.getAttribute('src') || '';
            return src.replace('assets/js/global-nav.js', '');
        }
        return '';
    }

    // Injecte le favicon sur toutes les pages
    injectFavicon() {
        if (!document.querySelector('link[rel="icon"]')) {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = this.basePath + 'favicon.ico';
            document.head.appendChild(link);
        }
    }

    // Injecte CSS et JS manquants sur les pages qui ne les ont pas
    injectMissingAssets() {
        // Preconnect — skip if already in HTML (now added statically)
        if (!document.querySelector('link[rel="preconnect"]')) {
            ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://www.gstatic.com', 'https://firestore.googleapis.com'].forEach(href => {
                const pc = document.createElement('link');
                pc.rel = 'preconnect';
                pc.href = href;
                if (href !== 'https://fonts.googleapis.com') pc.crossOrigin = 'anonymous';
                document.head.prepend(pc);
            });
        }
        // components.css — skip if bundle.css already loaded (contains components.css)
        if (!document.querySelector('link[href*="components.css"]') && !document.querySelector('link[href*="bundle.css"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = this.basePath + 'assets/css/components.css';
            document.head.appendChild(css);
        }
        // auth.js (module)
        if (!document.querySelector('script[src*="auth.js"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = this.basePath + 'assets/js/auth.js';
            document.body.appendChild(script);
        }
        // site-search.js (defer)
        if (!document.querySelector('script[src*="site-search.js"]')) {
            const script = document.createElement('script');
            script.src = this.basePath + 'assets/js/site-search.js';
            script.defer = true;
            document.body.appendChild(script);
        }
    }

    // Remplace le logo-icon "M" par l'image du serveur RP
    injectServerLogo() {
        const logoIcon = document.querySelector('.logo-icon');
        if (logoIcon) {
            const img = document.createElement('img');
            img.src = this.basePath + 'assets/images/logo-serveur.jpg';
            img.alt = 'Logo Serveur';
            img.className = 'header-server-logo';
            img.style.cssText = 'width:38px;height:38px;border-radius:4px;object-fit:cover;';
            logoIcon.parentNode.replaceChild(img, logoIcon);
        }
    }

    // Injecte la barre de recherche après la nav sur toutes les pages
    injectSearchBar() {
        // Ne pas dupliquer si déjà présent
        if (document.getElementById('search-container')) return;
        const nav = document.querySelector('.main-nav');
        if (!nav) return;
        const searchHTML = `
            <div id="search-container" style="max-width:1400px;margin:0.5rem auto;padding:0 2rem;">
                <div style="position:relative;">
                    <input type="text" id="site-search" placeholder="Rechercher dans la documentation... (Ctrl+K)" 
                           style="width:100%;padding:0.5rem 1rem 0.5rem 2.2rem;background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);font-family:'Rajdhani',sans-serif;font-size:0.88rem;outline:none;"
                           autocomplete="off">
                    <span style="position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:0.85rem;">&#128269;</span>
                </div>
                <div id="search-results"></div>
            </div>
        `;
        nav.insertAdjacentHTML('afterend', searchHTML);
    }

    // Remplace l'effet glitch par un style propre sur les titres
    cleanGlitchText() {
        document.querySelectorAll('.glitch-text').forEach(el => {
            el.classList.remove('glitch-text');
            el.removeAttribute('data-text');
        });
    }

    // Bouton retour en arrière flottant (masqué sur index.html)
    injectBackButton() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage === 'index.html' || currentPage === '' || currentPage === 'login.html' || currentPage === 'register.html') return;
        if (document.getElementById('backBtnFloat')) return;

        const btn = document.createElement('a');
        btn.id = 'backBtnFloat';
        btn.className = 'back-btn-float';
        btn.href = 'javascript:void(0)';
        btn.innerHTML = '<span class="back-arrow">◄</span> RETOUR';
        btn.onclick = (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = this.basePath + 'index.html';
            }
        };
        document.body.appendChild(btn);
    }

    getMenuStructure() {
        // Use Firestore nav config if loaded, otherwise fall back to hardcoded
        if (this.navOverride && this.navOverride.row1 && this.navOverride.row2) {
            const filterItems = (items) => items
                .filter(item => !item.hidden)
                .map(item => {
                    const clean = { label: item.label, url: item.url };
                    if (item.dropdown && item.dropdown.length > 0) {
                        clean.dropdown = item.dropdown.filter(sub => !sub.hidden);
                    }
                    return clean;
                });
            return {
                row1: filterItems(this.navOverride.row1),
                row2: filterItems(this.navOverride.row2)
            };
        }
        // Hardcoded default
        return {
            row1: [
                { label: 'ACCUEIL', url: 'index.html' },
                { label: 'LOYALISME', url: 'loyalisme.html' },
                { label: 'JUGEMENT', url: 'jugement.html' },
                { label: 'CONTREBANDE', url: 'contrebande.html' },
                { label: 'HIERARCHIE', url: 'hierarchie.html' },
                { label: 'CODEX', url: 'codex.html' },
                {
                    label: 'GUIDE',
                    url: 'guide.html',
                    dropdown: [
                        { label: 'Terminologie', url: 'guide-terminologie.html' },
                        { label: 'Respect & Salutations', url: 'guide-respect.html' },
                        { label: 'Commandement', url: 'guide-commandement.html' },
                        { label: 'Dispatch & Haut-parleur', url: 'guide-dispatch.html' },
                        { label: 'Code Vestimentaire', url: 'guide-vestimentaire.html' },
                        { label: 'Formations Tactiques', url: 'guide-formations.html' },
                        { label: 'Sociostatus', url: 'guide-sociostatus.html' },
                        { label: 'Brèches & Sanctions', url: 'guide-breches.html' },
                        { label: 'Équipement', url: 'equipment.html' },
                        { label: 'Tactique', url: 'tactics.html' },
                        { label: 'Unités & Grades', url: 'units.html' }
                    ]
                },
                {
                    label: 'COURS',
                    url: 'cours.html',
                    dropdown: [
                        { label: 'Cours RCT', url: 'cours-rct.html' },
                        { label: 'Cours 05+', url: 'cours-05.html' },
                        { label: 'Cours 03+', url: 'cours-03.html' }
                    ]
                },
                {
                    label: 'PROCEDURES',
                    url: 'procedures.html',
                    dropdown: [
                        { label: 'Declarations MPF', url: 'declarations.html' },
                        { label: 'Test de Loyauté', url: 'test-loyaute.html' },
                        { label: 'Conscription', url: 'procedure-conscription.html' },
                        { label: 'Incarcération', url: 'procedure-incarceration.html' },
                        { label: 'Code 7 & Escouade', url: 'procedure-code7.html' },
                        { label: 'Procédures Générales', url: 'procedures-generales.html' }
                    ]
                },
                {
                    label: 'CWU',
                    url: 'cwu.html',
                    dropdown: [
                        { label: 'Procédure CWU-MPF', url: 'cwu-procedure.html' }
                    ]
                },
                { label: 'SCANNER', url: 'scanner.html' },
                { label: 'CARTE', url: 'carte.html' },
                { label: 'À PROPOS', url: 'about.html' }
            ],
            row2: [
                {
                    label: 'ACTIVITE',
                    url: 'activite.html',
                    dropdown: [
                        { label: 'Planning Semaine', url: 'activite-tableaux.html' },
                        { label: 'Activité Milice', url: 'activite-milice.html' }
                    ]
                },
                {
                    label: 'DIVISIONS',
                    url: 'divisions.html',
                    dropdown: [
                        { label: 'HELIX', url: 'divisions/helix.html' },
                        { label: 'RAZOR', url: 'divisions/razor.html' },
                        { label: 'JURY', url: 'divisions/jury.html' },
                        { label: 'EXOGEN', url: 'divisions/exogen.html' },
                        { label: 'GRID', url: 'divisions/grid.html' },
                        { label: 'ZONE', url: 'divisions/zone.html' },
                        { label: 'SPECTRE', url: 'divisions/spectre.html' }
                    ]
                },
                {
                    label: 'FORMULAIRES',
                    url: 'formulaires.html',
                    dropdown: [
                        { label: 'Rapport', url: 'form-rapport.html' },
                        { label: 'Dépense & Gain', url: 'form-depot.html' },
                        { label: 'Test', url: 'form-test.html' },
                        { label: 'Formation', url: 'form-formation.html' },
                        { label: 'Plainte', url: 'form-plainte.html' }
                    ]
                },
                {
                    label: 'RAPPORTS',
                    url: 'rapports.html',
                    dropdown: [
                        { label: 'Rapports', url: 'rapports.html' },
                        { label: 'Rapports Divisionnaires', url: 'rapports-divisionnaires.html' }
                    ]
                },
                { label: 'PAYES', url: 'payes.html' },
                { label: 'VIEWTIME', url: 'viewtime.html' },
                { label: 'RADIO & MDP', url: 'radio.html' },
                { label: 'ABSENCES', url: 'declaration-absence.html' },
                { label: 'LIENS', url: 'liens.html' }
            ]
        };
    }

    createNavigationHTML() {
        const menu = this.getMenuStructure();
        const navHTML = `
            <nav class="main-nav">
                <div class="nav-container">
                    <button class="mobile-menu-toggle" onclick="globalNav.toggleMobileMenu()">
                        MENU
                    </button>
                    <ul class="nav-list" id="mainNavList">
                        ${menu.row1.map(item => this.createNavItem(item)).join('')}
                    </ul>
                    <div class="nav-separator"></div>
                    <ul class="nav-list nav-list-row2" id="mainNavList2">
                        ${menu.row2.map(item => this.createNavItem(item)).join('')}
                    </ul>
                </div>
            </nav>
        `;

        const header = document.querySelector('.site-header');
        if (header) {
            header.insertAdjacentHTML('afterend', navHTML);
        }
    }

    createNavItem(item) {
        const hasDropdown = item.dropdown && item.dropdown.length > 0;

        let linkContent = item.label;
        if (hasDropdown) {
            linkContent += ' <span class="nav-arrow">▼</span>';
        }

        let html = `<li class="nav-item${hasDropdown ? ' has-dropdown' : ''}">`;
        html += `<a href="${this.basePath + item.url}" class="nav-link">${linkContent}</a>`;

        if (hasDropdown) {
            html += `<ul class="dropdown-menu">`;
            html += item.dropdown.map(subItem =>
                `<li class="dropdown-item"><a href="${this.basePath + subItem.url}" class="dropdown-link">${subItem.label}</a></li>`
            ).join('');
            html += `</ul>`;
        }

        html += '</li>';
        return html;
    }

    markActivePage() {
        const path = window.location.pathname;
        const currentPage = path.split('/').pop() || 'index.html';
        const pathParts = path.split('/');
        const currentFull = pathParts.length > 2 ? pathParts.slice(-2).join('/') : currentPage;
        const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

        navLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').replace(this.basePath, '');
            if (href === currentPage || href === currentFull) {
                link.classList.add('active');
                const parentItem = link.closest('.nav-item');
                if (parentItem) {
                    parentItem.classList.add('active-parent');
                }
            }
        });
    }

    toggleMobileMenu() {
        const navList = document.getElementById('mainNavList');
        const navList2 = document.getElementById('mainNavList2');
        const sep = document.querySelector('.nav-separator');
        if (navList) navList.classList.toggle('active');
        if (navList2) navList2.classList.toggle('active');
        if (sep) sep.classList.toggle('active');
    }

    setupDropdowns() {
        // Mobile: clic sur le nav-link toggle le dropdown au lieu de naviguer
        document.querySelectorAll('.nav-item.has-dropdown > .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parentItem = link.closest('.nav-item');
                    const isOpen = parentItem.classList.contains('dropdown-open');

                    // Fermer tous les autres dropdowns
                    document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
                        if (item !== parentItem) item.classList.remove('dropdown-open');
                    });

                    parentItem.classList.toggle('dropdown-open', !isOpen);
                }
            });
        });

        // Fermer les dropdowns quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-item')) {
                document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
                    item.classList.remove('dropdown-open');
                });
            }
        });
    }

    setupMobileMenu() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-link')) {
                if (window.innerWidth <= 768) {
                    document.querySelectorAll('.nav-list').forEach(nl => nl.classList.remove('active'));
                    const sep = document.querySelector('.nav-separator');
                    if (sep) sep.classList.remove('active');
                    document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
                        item.classList.remove('dropdown-open');
                    });
                }
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.querySelectorAll('.nav-list').forEach(nl => nl.classList.remove('active'));
                const sep = document.querySelector('.nav-separator');
                if (sep) sep.classList.remove('active');
                document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
                    item.classList.remove('dropdown-open');
                });
            }
        });
    }
}

function createSubTabs(tabs, currentPage) {
    const tabsHTML = `
        <div class="sub-tabs">
            <ul class="sub-tabs-list">
                ${tabs.map(tab => `
                    <li class="sub-tab-item">
                        <a href="${tab.url}" class="sub-tab-link ${tab.url === currentPage ? 'active' : ''}">
                            ${tab.label}
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        mainNav.insertAdjacentHTML('afterend', tabsHTML);
    }
}

let globalNav;
document.addEventListener('DOMContentLoaded', async () => {
    globalNav = new GlobalNavigation();
    await globalNav.checkMaintenanceRedirect();
});
