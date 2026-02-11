/* ============================================================
   CITY 17 INTERACTIVE MAP - JavaScript Controller
   ============================================================ */

(function() {
    'use strict';

    const zoneData = {
        'gare': {
            name: 'GARE',
            desc: 'Point d\'arrivée des trains Combine. Zone de contrôle d\'identité obligatoire. Flux civil permanent.',
            security: 'SURVEILLANCE CONSTANTE',
            secLevel: 'high'
        },
        'plaza': {
            name: 'PLAZA',
            desc: 'Place centrale de Cité 17. Zone de rassemblement civil, distribution de rations, écran Combine.',
            security: 'SURVEILLANCE MAXIMALE',
            secLevel: 'high'
        },
        'nexus': {
            name: 'NEXUS',
            desc: 'Quartier Général MPF. Centre de commandement, cellules de détention, armurerie. Accès MPF uniquement.',
            security: 'ACCÈS MPF UNIQUEMENT',
            secLevel: 'max'
        },
        'district1': {
            name: 'DISTRICT 1',
            desc: 'Bloc résidentiel civil. Couvre-feu strictement appliqué. Patrouilles régulières requises.',
            security: 'PATROUILLES RÉGULIÈRES',
            secLevel: 'medium'
        },
        'district2': {
            name: 'DISTRICT 2',
            desc: 'Bloc résidentiel civil secondaire. Zone de forte densité. Points d\'accès contrôlés.',
            security: 'PATROUILLES RÉGULIÈRES',
            secLevel: 'medium'
        },
        'district3': {
            name: 'DISTRICT 3',
            desc: 'Zone résidentielle périphérique. Activité suspecte fréquemment signalée.',
            security: 'VIGILANCE ACCRUE',
            secLevel: 'medium'
        },
        'district4': {
            name: 'DISTRICT 4',
            desc: 'Bloc résidentiel éloigné. Actes de résistance sporadiques. Binôme recommandé.',
            security: 'VIGILANCE ACCRUE',
            secLevel: 'medium'
        },
        'basse-ville': {
            name: 'BASSE VILLE',
            desc: 'Quartier inférieur. Réseau souterrain, activité de contrebande. Zone à risque pour le personnel.',
            security: 'ZONE DANGEREUSE - BINÔME REQUIS',
            secLevel: 'max'
        },
        'zone-interdite': {
            name: 'ZONE INTERDITE',
            desc: 'Périmètre extérieur militarisé. Accès strictement interdit aux civils. Autorisation OTA requise.',
            security: 'ZONE ROUGE - ACCÈS INTERDIT',
            secLevel: 'max'
        },
        'ota': {
            name: 'OTA',
            desc: 'Base Overwatch Trans-humaine. Opérations militaires avancées. Accès restreint autorisation spéciale.',
            security: 'ZONE MILITAIRE',
            secLevel: 'max'
        },
        'cch1': {
            name: 'CCH 1',
            desc: 'Checkpoint de contrôle 1. Vérification d\'identité, fouille, scan Combine.',
            security: 'POSTE DE CONTRÔLE',
            secLevel: 'high'
        },
        'cch2': {
            name: 'CCH 2',
            desc: 'Checkpoint de contrôle 2. Accès aux districts résidentiels.',
            security: 'POSTE DE CONTRÔLE',
            secLevel: 'high'
        },
        'cch3': {
            name: 'CCH 3',
            desc: 'Checkpoint de contrôle 3. Limite zone industrielle.',
            security: 'POSTE DE CONTRÔLE',
            secLevel: 'high'
        },
        'cch4': {
            name: 'CCH 4',
            desc: 'Checkpoint de contrôle 4. Accès secteur nord.',
            security: 'POSTE DE CONTRÔLE',
            secLevel: 'high'
        },
        'ccha': {
            name: 'CCHA',
            desc: 'Checkpoint avancé. Dernier point de contrôle avant zone interdite.',
            security: 'POSTE AVANCÉ',
            secLevel: 'max'
        },
        'cch-vort': {
            name: 'CCH VORT',
            desc: 'Checkpoint Vortigaunt. Zone de confinement des entités extraterrestres asservies.',
            security: 'CONFINEMENT ACTIF',
            secLevel: 'max'
        },
        'parc': {
            name: 'PARC',
            desc: 'Espace vert réglementé. Accès civil autorisé durant les heures de jour uniquement.',
            security: 'ACCÈS RÉGLEMENTÉ',
            secLevel: 'low'
        },
        'mine': {
            name: 'MINE',
            desc: 'Zone d\'extraction. Travail forcé sous supervision CWU. Accès interdit aux non-autorisés.',
            security: 'TRAVAIL FORCÉ',
            secLevel: 'high'
        },
        'livre': {
            name: 'LIVRE',
            desc: 'Point de collecte et destruction de littérature non-approuvée. Opérations de censure.',
            security: 'OPÉRATIONS CENSURE',
            secLevel: 'medium'
        },
        'epicerie': {
            name: 'EPICERIE',
            desc: 'Point de distribution alimentaire civile. Rations Combine disponibles sur présentation du carnet.',
            security: 'DISTRIBUTION RATIONS',
            secLevel: 'low'
        },
        'ration': {
            name: 'RATION',
            desc: 'Centre de distribution de rations Combine. File d\'attente réglementée. Contrôle MPF en permanence.',
            security: 'SURVEILLANCE CONSTANTE',
            secLevel: 'medium'
        },
        'hopital': {
            name: 'HÔPITAL',
            desc: 'Centre médical civil CWU. Soins basiques uniquement. Réquisitionnable par le commandement.',
            security: 'ACCÈS CWU',
            secLevel: 'low'
        },
        'qg-cwu': {
            name: 'QG CWU',
            desc: 'Quartier général de la Civil Workers\' Union. Administration civile sous contrôle Combine.',
            security: 'ACCÈS CWU + MPF',
            secLevel: 'medium'
        },
        'decheterie': {
            name: 'DÉCHÈTERIE',
            desc: 'Zone de traitement des déchets. Cachettes connues de la résistance. Raids réguliers.',
            security: 'ZONE SUSPECTE',
            secLevel: 'high'
        },
        'distillerie': {
            name: 'DISTILLERIE',
            desc: 'Installation de production illicite fréquemment repérée. Opérations de démantèlement récurrentes.',
            security: 'ZONE ILLICITE',
            secLevel: 'max'
        }
    };

    function initMap() {
        const container = document.querySelector('.city-map-container');
        if (!container) return;

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.innerHTML = '<div class="map-tooltip-title"></div><div class="map-tooltip-desc"></div><div class="map-tooltip-security"></div>';
        container.appendChild(tooltip);

        // Attach events to all zones
        const zones = container.querySelectorAll('.map-zone');
        zones.forEach(zone => {
            const zoneId = zone.dataset.zone;
            const data = zoneData[zoneId];
            if (!data) return;

            zone.addEventListener('mouseenter', (e) => {
                tooltip.querySelector('.map-tooltip-title').textContent = data.name;
                tooltip.querySelector('.map-tooltip-desc').textContent = data.desc;
                const secEl = tooltip.querySelector('.map-tooltip-security');
                secEl.textContent = '⚡ ' + data.security;
                secEl.className = 'map-tooltip-security ' + data.secLevel;
                tooltip.classList.add('visible');
            });

            zone.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                let x = e.clientX - rect.left + 15;
                let y = e.clientY - rect.top - 10;
                
                // Keep tooltip in bounds
                if (x + 260 > rect.width) x = x - 280;
                if (y + 120 > rect.height) y = y - 120;
                if (x < 0) x = 10;
                if (y < 0) y = 10;

                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            });

            zone.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMap);
    } else {
        initMap();
    }
})();
