// SEARCH & DYNAMIC FEATURES FOR MPF DOCUMENTATION
// Barre de recherche et fonctionnalités dynamiques

// ==================== SEARCH FUNCTIONALITY ====================
class MPFSearch {
    constructor() {
        this.searchIndex = [];
        this.init();
    }

    init() {
        this.createSearchBar();
        this.buildSearchIndex();
        this.attachEventListeners();
    }

    createSearchBar() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-wrapper">
                <input type="text" id="siteSearch" class="search-input" placeholder="🔍 Rechercher dans la documentation...">
                <div class="search-results" id="searchResults"></div>
            </div>
        `;

        const headerContent = header.querySelector('.header-content');
        const nav = headerContent.querySelector('.main-nav');
        if (nav && headerContent) {
            headerContent.insertBefore(searchContainer, nav);
        }
    }

    buildSearchIndex() {
        // Index des pages et contenus
        this.searchIndex = [
            { title: 'Worker Announcement', url: 'worker-announcement.html', keywords: ['travail', 'cwu', 'annonce', '03+'], category: 'Activité' },
            { title: 'Ration Announcement', url: 'ration-announcement.html', keywords: ['ration', 'distribution', 'plaza', '03+'], category: 'Activité' },
            { title: 'Suspended Rations', url: 'suspended-rations.html', keywords: ['suspension', 'ration', 'urgence', '63+'], category: 'Activité' },
            { title: 'Social Infraction', url: 'social-infraction.html', keywords: ['infraction', 'sociale', 'comportement', '03+'], category: 'Activité' },
            { title: 'Judgement Waiver', url: 'judgement-waiver.html', keywords: ['dérogation', 'jugement', 'exception', '01+'], category: 'Activité' },
            { title: 'Radio & Mdp', url: 'radio.html', keywords: ['fréquence', '119.8', 'radio', 'communication', 'milice', 'stockage'], category: 'Communication' },
            { title: 'Loyalisme', url: 'loyalisme.html', keywords: ['loyauté', 'points', 'brassard', 'niveau', 'citoyen', 'anti-citoyen', 'platine'], category: 'Système Social' },
            { title: 'Hiérarchie', url: 'hierarchie.html', keywords: ['grade', 'rang', 'salut', 'structure', 'organigramme'], category: 'Organisation' },
            { title: 'Jugement', url: 'jugement.html', keywords: ['verdict', 'peine', 'cycle', 'récidive', 'prison'], category: 'Justice' },
            { title: 'Contrebande', url: 'contrebande.html', keywords: ['contrebande', 'niveau', 'interdit', 'confiscation'], category: 'Sécurité' },
            { title: 'Codex', url: 'codex.html', keywords: ['loi', 'code', 'règlement', 'document'], category: 'Légal' },
            { title: 'Cours RCT', url: 'cours-rct.html', keywords: ['formation', 'recrue', 'rct', 'théorique'], category: 'Formation' },
            { title: 'Cours 05+', url: 'cours-05.html', keywords: ['formation', '05+', 'officier', 'avancé'], category: 'Formation' },
            { title: 'Cours 03+', url: 'cours-03.html', keywords: ['formation', '03+', 'élite', 'spécialisé'], category: 'Formation' },
            { title: 'Procédures Générales', url: 'procedures-generales.html', keywords: ['procédure', 'guide', 'protocole'], category: 'Guide' },
            { title: 'Conscription', url: 'conscription.html', keywords: ['recrutement', 'inscription', 'conscription'], category: 'Guide' },
            { title: 'Liens Utiles', url: 'liens.html', keywords: ['liens', 'ressources', 'externe'], category: 'Ressources' }
        ];
    }

    attachEventListeners() {
        const searchInput = document.getElementById('siteSearch');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }

            const results = this.search(query);
            this.displayResults(results, searchResults);
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                searchResults.style.display = 'none';
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchResults.innerHTML) {
                searchResults.style.display = 'block';
            }
        });
    }

    search(query) {
        return this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.keywords.join(' ')} ${item.category}`.toLowerCase();
            return searchText.includes(query);
        }).slice(0, 8); // Limit to 8 results
    }

    displayResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-result-item no-result">
                    <div class="result-icon">❌</div>
                    <div class="result-text">Aucun résultat trouvé</div>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        container.innerHTML = results.map(result => `
            <a href="${result.url}" class="search-result-item">
                <div class="result-category">${result.category}</div>
                <div class="result-title">${result.title}</div>
            </a>
        `).join('');
        
        container.style.display = 'block';
    }
}

// ==================== COLLAPSIBLE SECTIONS ====================
class CollapsibleSections {
    constructor() {
        this.init();
    }

    init() {
        this.makeCollapsible();
        this.attachEventListeners();
    }

    makeCollapsible() {
        // Convert loyalty cards to collapsible
        document.querySelectorAll('.loyalty-card').forEach((card, index) => {
            const content = card.querySelector('ul');
            if (!content) return;

            const header = card.querySelector('h3');
            if (!header) return;

            // Add collapse icon
            const icon = document.createElement('span');
            icon.className = 'collapse-icon';
            icon.innerHTML = '▼';
            header.appendChild(icon);

            // Hide content by default (except first 3)
            if (index > 2) {
                content.style.display = 'none';
                card.classList.add('collapsed');
            }

            // Make header clickable
            header.style.cursor = 'pointer';
            header.classList.add('collapsible-header');
        });

        // Convert terminal sections to collapsible
        document.querySelectorAll('.combine-terminal-wrapper').forEach(terminal => {
            const header = terminal.querySelector('.combine-header h2');
            const body = terminal.querySelector('.combine-body');
            
            if (!header || !body) return;

            // Add collapse icon
            const icon = document.createElement('span');
            icon.className = 'collapse-icon';
            icon.innerHTML = '▼';
            icon.style.marginLeft = '1rem';
            header.appendChild(icon);

            header.style.cursor = 'pointer';
            header.classList.add('collapsible-header');
        });
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.collapsible-header');
            if (!header) return;

            const parent = header.closest('.loyalty-card, .combine-terminal-wrapper');
            if (!parent) return;

            const content = parent.querySelector('ul, .combine-body');
            const icon = header.querySelector('.collapse-icon');
            
            if (!content || !icon) return;

            // Toggle visibility
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.innerHTML = '▼';
                parent.classList.remove('collapsed');
                
                // Smooth scroll into view
                setTimeout(() => {
                    parent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                content.style.display = 'none';
                icon.innerHTML = '▶';
                parent.classList.add('collapsed');
            }
        });
    }
}

// ==================== FILTER SYSTEM ====================
class FilterSystem {
    constructor() {
        this.init();
    }

    init() {
        this.createFilterBar();
        this.attachEventListeners();
    }

    createFilterBar() {
        const main = document.querySelector('main .container');
        if (!main) return;

        // Check if we're on a page with filterable content
        const hasLoyaltyCards = document.querySelectorAll('.loyalty-card').length > 0;
        if (!hasLoyaltyCards) return;

        const filterBar = document.createElement('div');
        filterBar.className = 'filter-bar animate-fadeInDown';
        filterBar.innerHTML = `
            <div class="filter-title">🔍 FILTRER PAR :</div>
            <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all">Tous</button>
                <button class="filter-btn" data-filter="anti-citoyen">Anti-Citoyens</button>
                <button class="filter-btn" data-filter="citoyen">Citoyen</button>
                <button class="filter-btn" data-filter="loyaliste">Loyalistes</button>
                <button class="filter-btn" data-filter="platine">Platine</button>
            </div>
        `;

        const firstTerminal = main.querySelector('.combine-terminal-wrapper');
        if (firstTerminal) {
            firstTerminal.parentNode.insertBefore(filterBar, firstTerminal.nextSibling);
        }
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('.filter-btn');
            if (!filterBtn) return;

            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');

            const filter = filterBtn.dataset.filter;
            this.applyFilter(filter);
        });
    }

    applyFilter(filter) {
        const cards = document.querySelectorAll('.loyalty-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            
            let show = false;
            
            if (filter === 'all') {
                show = true;
            } else if (filter === 'anti-citoyen') {
                show = title.includes('anti-citoyen');
            } else if (filter === 'citoyen' && !title.includes('anti-citoyen')) {
                show = title.includes('citoyen') && !title.includes('loyaliste');
            } else if (filter === 'loyaliste') {
                show = title.includes('loyaliste') && !title.includes('platine');
            } else if (filter === 'platine') {
                show = title.includes('platine');
            }

            if (show) {
                card.style.display = 'block';
                card.classList.add('animate-fadeIn');
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// ==================== EXPAND ALL / COLLAPSE ALL ====================
class BulkActions {
    constructor() {
        this.init();
    }

    init() {
        this.createActionButtons();
        this.attachEventListeners();
    }

    createActionButtons() {
        const main = document.querySelector('main .container');
        if (!main) return;

        const hasCollapsible = document.querySelectorAll('.collapsible-header').length > 0;
        if (!hasCollapsible) return;

        const actionBar = document.createElement('div');
        actionBar.className = 'bulk-actions animate-fadeInDown';
        actionBar.innerHTML = `
            <button class="bulk-btn expand-all">📂 Tout Ouvrir</button>
            <button class="bulk-btn collapse-all">📁 Tout Fermer</button>
        `;

        const firstCollapsible = main.querySelector('.loyalty-card, .combine-terminal-wrapper');
        if (firstCollapsible) {
            firstCollapsible.parentNode.insertBefore(actionBar, firstCollapsible);
        }
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.expand-all')) {
                this.expandAll();
            } else if (e.target.closest('.collapse-all')) {
                this.collapseAll();
            }
        });
    }

    expandAll() {
        document.querySelectorAll('.loyalty-card, .combine-terminal-wrapper').forEach(item => {
            const content = item.querySelector('ul, .combine-body');
            const icon = item.querySelector('.collapse-icon');
            
            if (content && icon) {
                content.style.display = 'block';
                icon.innerHTML = '▼';
                item.classList.remove('collapsed');
            }
        });
    }

    collapseAll() {
        document.querySelectorAll('.loyalty-card, .combine-terminal-wrapper').forEach(item => {
            const content = item.querySelector('ul, .combine-body');
            const icon = item.querySelector('.collapse-icon');
            
            if (content && icon) {
                content.style.display = 'none';
                icon.innerHTML = '▶';
                item.classList.add('collapsed');
            }
        });
    }
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    new MPFSearch();
    new CollapsibleSections();
    new FilterSystem();
    new BulkActions();
    initSmoothScroll();

    console.log('✅ MPF Dynamic Features Loaded');
});
