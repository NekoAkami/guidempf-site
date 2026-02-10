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
        // Scanlines disabled for cleaner look
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
                }
            });
        }, this.options);

        this.elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
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
