// SYSTÈME INTERACTIF COMBINE - JAVASCRIPT

class InteractiveSystem {
    constructor() {
        this.init();
    }

    init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupTabs();
        this.setupFilters();
        this.setupCardAnimations();
        this.setupScanlines();
        this.setupTooltips();
        this.setupScrollReveal();
        this.setupBackToTop();
        this.setupPageEntry();
        this.setupKeyboardShortcuts();
    }

    // ==================== SYSTÈME DE TABS ====================
    setupTabs() {
        const tabContainers = document.querySelectorAll('.tabs-container');
        
        tabContainers.forEach(container => {
            const tabs = container.querySelectorAll('.tab-btn');
            const contents = container.querySelectorAll('.tab-content');
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    // Retirer active de tous les tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    contents.forEach(c => c.classList.remove('active'));
                    
                    // Ajouter active au tab cliqué
                    tab.classList.add('active');
                    contents[index].classList.add('active');
                    
                    // Smooth scroll vers le contenu
                    setTimeout(() => {
                        contents[index].scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }, 100);
                });
            });
            
            // Activer le premier tab par défaut
            if (tabs.length > 0 && !container.querySelector('.tab-btn.active')) {
                tabs[0].click();
            }
        });
    }

    // ==================== FILTRES INTERACTIFS ====================
    setupFilters() {
        const filterSections = document.querySelectorAll('.filter-section');
        
        filterSections.forEach(section => {
            const filterBtns = section.querySelectorAll('.filter-btn');
            const targetGrid = section.getAttribute('data-target');
            
            if (!targetGrid) return;
            
            const cards = document.querySelectorAll(`${targetGrid} .info-card`);
            
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const filter = btn.getAttribute('data-filter');
                    
                    // Toggle active state
                    if (filter === 'all') {
                        // Bouton "Tout afficher" : désactiver tous les autres filtres
                        filterBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        cards.forEach(card => {
                            card.style.display = '';
                            card.classList.add('animate-card');
                        });
                    } else {
                        // Si "Tout afficher" est actif, le désactiver
                        const allBtn = section.querySelector('[data-filter="all"]');
                        if (allBtn) allBtn.classList.remove('active');
                        
                        // Toggle le filtre cliqué
                        btn.classList.toggle('active');
                        
                        // Obtenir tous les filtres actifs
                        const activeFilters = Array.from(section.querySelectorAll('.filter-btn.active:not([data-filter="all"])'))
                            .map(b => b.getAttribute('data-filter'));
                        
                        // Si aucun filtre actif, afficher tout
                        if (activeFilters.length === 0) {
                            cards.forEach(card => {
                                card.style.display = '';
                                card.classList.add('animate-card');
                            });
                            if (allBtn) allBtn.classList.add('active');
                        } else {
                            // Filtrer les cartes
                            cards.forEach(card => {
                                const cardCategories = (card.getAttribute('data-category') || '').split(' ');
                                const matches = activeFilters.some(f => cardCategories.includes(f));
                                
                                if (matches) {
                                    card.style.display = '';
                                    card.classList.add('animate-card');
                                } else {
                                    card.style.display = 'none';
                                    card.classList.remove('animate-card');
                                }
                            });
                        }
                    }
                });
            });
            
            // Activer "Tout afficher" par défaut
            const allBtn = section.querySelector('[data-filter="all"]');
            if (allBtn) allBtn.click();
        });
    }

    // ==================== ANIMATIONS CARTES ====================
    setupCardAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-card');
                }
            });
        }, observerOptions);

        // Observer toutes les cartes
        document.querySelectorAll('.info-card').forEach(card => {
            observer.observe(card);
        });
    }

    // ==================== SCANLINES EFFECT ====================
    setupScanlines() {
        // Ajouter scanlines aux cartes
        document.querySelectorAll('.info-card').forEach(card => {
            if (!card.classList.contains('no-scanlines')) {
                card.classList.add('scanlines');
            }
        });
    }

    // ==================== TOOLTIPS ====================
    setupTooltips() {
        document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
            const content = trigger.querySelector('.tooltip-content');
            if (!content) return;
            
            trigger.addEventListener('mouseenter', () => {
                // Vérifier si le tooltip sort de l'écran
                const rect = content.getBoundingClientRect();
                if (rect.left < 0) {
                    content.style.left = '0';
                    content.style.transform = 'translateX(0) translateY(0)';
                } else if (rect.right > window.innerWidth) {
                    content.style.left = 'auto';
                    content.style.right = '0';
                    content.style.transform = 'translateX(0) translateY(0)';
                }
            });
        });
    }

    // ==================== SCROLL REVEAL AUTO ====================
    setupScrollReveal() {
        const selectors = '.info-card, .combine-terminal-wrapper, .doc-card, .org-box, .section-divider, .code-grid, .accordion-section';
        const elements = document.querySelectorAll(selectors);
        if (elements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('sr-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        elements.forEach((el, i) => {
            const delay = Math.min(i * 0.06, 0.5);
            el.classList.add('sr-init');
            el.style.transitionDelay = `${delay}s`;
            observer.observe(el);
        });
    }

    // ==================== BACK TO TOP ====================
    setupBackToTop() {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Retour en haut');
        btn.innerHTML = '▲';
        document.body.appendChild(btn);

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== PAGE ENTRY ====================
    setupPageEntry() {
        const main = document.querySelector('main');
        if (main) main.classList.add('page-entry');
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                const search = document.querySelector('#siteSearch, #site-search, #codex-filter, [type="search"], .search-input');
                if (search) {
                    e.preventDefault();
                    search.focus();
                    search.select();
                }
            }
            if (e.key === 'Escape' && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                document.activeElement.blur();
            }
        });
    }
}

// ==================== UTILITAIRES ====================

// Fonction de recherche rapide pour cartes
class CardSearch {
    constructor(inputSelector, cardsSelector) {
        this.input = document.querySelector(inputSelector);
        this.cards = document.querySelectorAll(cardsSelector);
        
        if (this.input && this.cards.length > 0) {
            this.setup();
        }
    }

    setup() {
        this.input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            this.cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                const matches = text.includes(searchTerm);
                
                if (matches || searchTerm === '') {
                    card.style.display = '';
                    card.classList.add('animate-card');
                } else {
                    card.style.display = 'none';
                    card.classList.remove('animate-card');
                }
            });
        });
    }
}

// ==================== EFFETS GLITCH ====================
function addGlitchEffect(element, text) {
    if (!element) return;
    
    element.classList.add('glitch-effect');
    element.setAttribute('data-text', text || element.textContent);
}

// ==================== COMPTEUR ANIMÉ ====================
function animateCounter(element, targetValue, duration = 2000) {
    if (!element) return;
    
    const start = parseInt(element.textContent) || 0;
    const increment = (targetValue - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// ==================== SCROLL RÉVÉLATION ====================
class ScrollReveal {
    constructor(selector, options = {}) {
        this.elements = document.querySelectorAll(selector);
        this.options = {
            threshold: options.threshold || 0.15,
            rootMargin: options.rootMargin || '0px 0px -50px 0px'
        };
        this.setup();
    }

    setup() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, this.options);

        this.elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(25px)';
            el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
            observer.observe(el);
        });
    }
}

// Style pour les éléments révélés
const style = document.createElement('style');
style.textContent = `
    .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    /* Scroll Reveal Init */
    .sr-init {
        opacity: 0;
        transform: translateY(25px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .sr-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    /* Back to Top Button */
    .back-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 44px;
        height: 44px;
        background: rgba(4, 10, 20, 0.92);
        border: 1px solid rgba(0, 170, 255, 0.3);
        color: var(--accent-cyan, #0af);
        font-size: 1.3rem;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transform: translateY(12px);
        transition: opacity 0.3s, visibility 0.3s, transform 0.3s, background 0.2s, border-color 0.2s;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
    }
    .back-to-top.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    .back-to-top:hover {
        background: rgba(0, 170, 255, 0.15);
        border-color: var(--accent-cyan, #0af);
        transform: translateY(-2px);
    }
    /* Page Entry */
    .page-entry {
        animation: pageSlideIn 0.45s ease-out both;
    }
    @keyframes pageSlideIn {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
    }
    /* Smooth filter item transitions */
    .filter-animate {
        transition: opacity 0.25s ease, transform 0.25s ease !important;
    }
    .filter-hidden {
        opacity: 0 !important;
        transform: scale(0.95) !important;
        pointer-events: none;
        position: absolute !important;
        visibility: hidden;
    }
`;
document.head.appendChild(style);

// ==================== INITIALISATION AUTOMATIQUE ====================
const interactiveSystem = new InteractiveSystem();

// Exporter pour utilisation globale
window.InteractiveSystem = InteractiveSystem;
window.CardSearch = CardSearch;
window.ScrollReveal = ScrollReveal;
window.addGlitchEffect = addGlitchEffect;
window.animateCounter = animateCounter;
