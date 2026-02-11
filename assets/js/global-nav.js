// ========================================
// NAVIGATION GLOBALE - MPF COMBINE TERMINAL
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
            { label: 'SCANNER', url: 'scanner.html' },
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
                <a href="${item.url}" class="nav-link ${dropdownClass}">${item.label}</a>
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

    markActivePage() {
        setTimeout(() => {
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
        }, 100);
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
