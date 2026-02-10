// ========================================
// NAVIGATION GLOBALE - MPF Documentation
// ========================================

class GlobalNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.createNavigationHTML();
        this.markActivePage();
        this.setupMobileMenu();
        this.setupDropdowns();
    }

    // Structure complète du menu
    getMenuStructure() {
        return [
            { label: 'Accueil', url: 'index.html', icon: '🏠' },
            { 
                label: 'Activité', 
                url: 'activite.html', 
                icon: '📋',
                dropdown: [
                    { label: 'Tableaux Milice', url: 'activite-tableaux.html' },
                    { label: 'Worker Announcement', url: 'worker-announcement.html' },
                    { label: 'Ration Announcement', url: 'ration-announcement.html' },
                    { label: 'Suspended Rations', url: 'suspended-rations.html' },
                    { label: 'Social Infraction', url: 'social-infraction.html' },
                    { label: 'Judgement Waiver', url: 'judgement-waiver.html' }
                ]
            },
            { label: 'Radio & Mdp', url: 'radio.html', icon: '📡' },
            { label: 'Loyalisme', url: 'loyalisme.html', icon: '⭐' },
            { label: 'Jugement', url: 'jugement.html', icon: '⚖️' },
            { label: 'Contrebande', url: 'contrebande.html', icon: '📦' },
            { label: 'Hiérarchie', url: 'hierarchie.html', icon: '👥' },
            { label: 'Codex', url: 'codex.html', icon: '📜' },
            { 
                label: 'Guide', 
                url: 'guide.html', 
                icon: '📘',
                dropdown: [
                    { label: 'Dispatch & Haut-parleur', url: 'guide-dispatch.html' },
                    { label: 'Terminologie', url: 'guide-terminologie.html' },
                    { label: 'Respect & Salutations', url: 'guide-respect.html' },
                    { label: 'Code Vestimentaire', url: 'guide-vestimentaire.html' },
                    { label: 'Commandement', url: 'guide-commandement.html' },
                    { label: 'Divisions', url: 'guide-divisions.html' },
                    { label: 'Brèches de Protocoles', url: 'guide-breches.html' },
                    { label: 'Formations Complémentaires', url: 'guide-formations.html' },
                    { label: 'Sociostatus', url: 'guide-sociostatus.html' }
                ]
            },
            { 
                label: 'Cours Théoriques', 
                url: 'cours.html', 
                icon: '📗',
                dropdown: [
                    { label: 'Cours RCT', url: 'cours-rct.html' },
                    { label: 'Cours 05+', url: 'cours-05.html' },
                    { label: 'Cours 03+', url: 'cours-03.html' }
                ]
            },
            { 
                label: 'Procédures Générales', 
                url: 'procedures.html', 
                icon: '📕',
                dropdown: [
                    { label: 'Conscription', url: 'procedure-conscription.html' },
                    { label: 'Test de Loyauté', url: 'procedure-test-loyaute.html' },
                    { label: 'Incarcération', url: 'procedure-incarceration.html' },
                    { label: 'Dispatch Administrateur', url: 'procedure-dispatch-admin.html' },
                    { label: 'Code 7 Escouade', url: 'procedure-code7.html' }
                ]
            },
            { 
                label: 'CWU', 
                url: 'cwu.html', 
                icon: '🔧',
                dropdown: [
                    { label: 'Procédure CWU-MPF', url: 'cwu-procedure.html' }
                ]
            },
            { label: 'Scanner & Central', url: 'scanner.html', icon: '🖥️' },
            { label: 'Carte Cité 17', url: 'carte.html', icon: '🗺️' },
            { label: 'Liens Utiles', url: 'liens.html', icon: '🔗' }
        ];
    }

    // Créer le HTML de la navigation
    createNavigationHTML() {
        const menuStructure = this.getMenuStructure();
        const navHTML = `
            <nav class="main-nav">
                <div class="nav-container">
                    <button class="mobile-menu-toggle" onclick="globalNav.toggleMobileMenu()">
                        ☰ MENU
                    </button>
                    <ul class="nav-list" id="mainNavList">
                        ${menuStructure.map(item => this.createNavItem(item)).join('')}
                    </ul>
                </div>
            </nav>
        `;
        
        // Insérer la navigation après le header
        const header = document.querySelector('.site-header');
        if (header) {
            header.insertAdjacentHTML('afterend', navHTML);
        }
    }

    // Créer un item de navigation
    createNavItem(item) {
        const hasDropdown = item.dropdown && item.dropdown.length > 0;
        const dropdownClass = hasDropdown ? 'has-dropdown' : '';
        
        let html = `
            <li class="nav-item">
                <a href="${item.url}" class="nav-link ${dropdownClass}">${item.icon} ${item.label}</a>
        `;
        
        if (hasDropdown) {
            html += `
                <ul class="dropdown-menu">
                    ${item.dropdown.map(subItem => `
                        <li class="dropdown-item">
                            <a href="${subItem.url}" class="dropdown-link">${subItem.label}</a>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        html += '</li>';
        return html;
    }

    // Marquer la page active
    markActivePage() {
        setTimeout(() => {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    link.classList.add('active');
                    
                    // Si c'est dans un dropdown, ouvrir le parent en mode mobile
                    const parentItem = link.closest('.nav-item');
                    if (parentItem) {
                        parentItem.classList.add('active-parent');
                    }
                }
            });
        }, 100);
    }

    // Menu mobile
    toggleMobileMenu() {
        const navList = document.getElementById('mainNavList');
        if (navList) {
            navList.classList.toggle('active');
        }
    }

    // Dropdowns mobile
    setupDropdowns() {
        // Sur mobile, toggle le dropdown au clic
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

    // Setup événements mobile
    setupMobileMenu() {
        // Fermer le menu quand on clique sur un lien
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-link')) {
                const navList = document.getElementById('mainNavList');
                if (navList && window.innerWidth <= 768) {
                    navList.classList.remove('active');
                }
            }
        });

        // Réinitialiser au redimensionnement
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

// Fonction utilitaire pour créer des sous-onglets (pour les pages avec sous-sections)
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
    
    // Insérer après la navigation principale
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        mainNav.insertAdjacentHTML('afterend', tabsHTML);
    }
}

// Initialiser la navigation au chargement
let globalNav;
document.addEventListener('DOMContentLoaded', () => {
    globalNav = new GlobalNavigation();
});
