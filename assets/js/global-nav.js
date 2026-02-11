// ========================================
// NAVIGATION GLOBALE - MPF COMBINE TERMINAL
// ========================================

class GlobalNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.basePath = this.getBasePath();
        this.injectFavicon();
        this.injectServerLogo();
        this.injectMissingAssets();
        this.createNavigationHTML();
        this.injectSearchBar();
        this.markActivePage();
        this.setupMobileMenu();
        this.setupDropdowns();
        this.cleanGlitchText();
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
        // components.css
        if (!document.querySelector('link[href*="components.css"]')) {
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
        // site-search.js
        if (!document.querySelector('script[src*="site-search.js"]')) {
            const script = document.createElement('script');
            script.src = this.basePath + 'assets/js/site-search.js';
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

    getMenuStructure() {
        return [
            { label: 'ACCUEIL', url: 'index.html' },
            {
                label: 'ACTIVITE',
                url: 'activite.html',
                dropdown: [
                    { label: 'Tableaux Milice', url: 'activite-tableaux.html' },
                    { label: 'Worker Announcement', url: 'worker-announcement.html' },
                    { label: 'Ration Announcement', url: 'ration-announcement.html' },
                    { label: 'Suspended Rations', url: 'suspended-rations.html' },
                    { label: 'Social Infraction', url: 'social-infraction.html' },
                    { label: 'Judgement Waiver', url: 'judgement-waiver.html' }
                ]
            },
            { label: 'RADIO & MDP', url: 'radio.html' },
            { label: 'LOYALISME', url: 'loyalisme.html' },
            { label: 'JUGEMENT', url: 'jugement.html' },
            { label: 'CONTREBANDE', url: 'contrebande.html' },
            { label: 'HIERARCHIE', url: 'hierarchie.html' },
            { label: 'CODEX', url: 'codex.html' },
            {
                label: 'GUIDE',
                url: 'guide.html',
                dropdown: [
                    { label: 'Divisions MPF', url: 'divisions.html' },
                    { label: 'Dispatch & Haut-parleur', url: 'guide-dispatch.html' },
                    { label: 'Terminologie', url: 'guide-terminologie.html' },
                    { label: 'Respect & Salutations', url: 'guide-respect.html' },
                    { label: 'Code Vestimentaire', url: 'guide-vestimentaire.html' },
                    { label: 'Commandement', url: 'guide-commandement.html' },
                    { label: 'Breches de Protocoles', url: 'guide-breches.html' },
                    { label: 'Formations Complementaires', url: 'guide-formations.html' },
                    { label: 'Sociostatus', url: 'guide-sociostatus.html' }
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
                    { label: 'Test de Loyaute', url: 'test-loyaute.html' },
                    { label: 'Conscription', url: 'procedure-conscription.html' },
                    { label: 'Incarceration', url: 'procedure-incarceration.html' },
                    { label: 'Dispatch Administrateur', url: 'procedure-dispatch-admin.html' },
                    { label: 'Code 7 Escouade', url: 'procedure-code7.html' }
                ]
            },
            {
                label: 'CWU',
                url: 'cwu.html',
                dropdown: [
                    { label: 'Procedure CWU-MPF', url: 'cwu-procedure.html' }
                ]
            },
            {
                label: 'FORMULAIRES',
                url: 'formulaires.html',
                dropdown: [
                    { label: 'Rapport', url: 'form-rapport.html' },
                    { label: 'Dépense et Gain', url: 'form-depenses.html' },
                    { label: 'Rapport Complet', url: 'form-rapport-complet.html' },
                    { label: 'Test', url: 'form-test.html' },
                    { label: 'Formation', url: 'form-formation.html' }
                ]
            },
            { label: 'SCANNER', url: 'scanner.html' },
            { label: 'VIEWTIME', url: 'viewtime.html' },
            { label: 'ABSENCES', url: 'declaration-absence.html' },
            { label: 'CARTE', url: 'carte.html' },
            { label: 'LIENS', url: 'liens.html' }
        ];
    }

    createNavigationHTML() {
        const menuStructure = this.getMenuStructure();
        const navHTML = `
            <nav class="main-nav">
                <div class="nav-container">
                    <button class="mobile-menu-toggle" onclick="globalNav.toggleMobileMenu()">
                        MENU
                    </button>
                    <ul class="nav-list" id="mainNavList">
                        ${menuStructure.map(item => this.createNavItem(item)).join('')}
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
        const dropdownClass = hasDropdown ? 'has-dropdown' : '';

        let html = `
            <li class="nav-item">
                <a href="${this.basePath + item.url}" class="nav-link ${dropdownClass}">${item.label}</a>
        `;

        if (hasDropdown) {
            html += `
                <ul class="dropdown-menu">
                    ${item.dropdown.map(subItem => `
                        <li class="dropdown-item">
                            <a href="${this.basePath + subItem.url}" class="dropdown-link">${subItem.label}</a>
                        </li>
                    `).join('')}
                </ul>
            `;
        }

        html += '</li>';
        return html;
    }

    markActivePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
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
        if (navList) {
            navList.classList.toggle('active');
        }
    }

    setupDropdowns() {
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.nav-link.has-dropdown').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const parentItem = link.closest('.nav-item');
                    parentItem.classList.toggle('mobile-open');
                });
            });
        }
    }

    setupMobileMenu() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-link')) {
                const navList = document.getElementById('mainNavList');
                if (navList && window.innerWidth <= 768) {
                    navList.classList.remove('active');
                }
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                const navList = document.getElementById('mainNavList');
                if (navList) {
                    navList.classList.remove('active');
                }
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('mobile-open');
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
document.addEventListener('DOMContentLoaded', () => {
    globalNav = new GlobalNavigation();
});
