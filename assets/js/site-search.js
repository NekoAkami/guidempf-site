/* ============================================================
   SITE SEARCH ENGINE - Recherche dans la documentation MPF
   ============================================================ */
(function() {
  'use strict';

  // Index des pages du site avec mots-clés
  const PAGES_INDEX = [
    { url: 'index.html', title: 'Accueil', category: 'Navigation', keywords: 'accueil page principale documentation' },
    { url: 'hierarchie.html', title: 'Hiérarchie', category: 'Organisation', keywords: 'grade rang promotion organigramme commandement officier trooper recruit rct i1 i2 i3 i4 i5 01 02 03 04 05 epu helix jury grid nova' },
    { url: 'radio.html', title: 'Radio & Mots de Passe', category: 'Communication', keywords: 'radio fréquence mot de passe mdp communication dispatch 10-codes' },
    { url: 'loyalisme.html', title: 'Loyalisme', category: 'Citoyens', keywords: 'loyalisme loyauté brassard citoyen suspect solidaire loyal distingué exemplaire' },
    { url: 'jugement.html', title: 'Jugement', category: 'Justice', keywords: 'jugement verdict peine cycle rééducation récidive sanction tribunal' },
    { url: 'contrebande.html', title: 'Contrebande', category: 'Infractions', keywords: 'contrebande objet interdit arme drogue résistance niveau' },
    { url: 'codex.html', title: 'Codex', category: 'Législation', keywords: 'codex code loi règle document officiel combine directive' },
    { url: 'equipment.html', title: 'Équipement', category: 'Matériel', keywords: 'équipement arme pistolet smg shotgun stunstick menottes radio gilet' },
    { url: 'divisions.html', title: 'Divisions', category: 'Organisation', keywords: 'division helix epu grid nova jury union spécialisation' },
    { url: 'tactics.html', title: 'Tactiques', category: 'Opérations', keywords: 'tactique formation combat raid breach escouade couverture' },
    { url: 'units.html', title: 'Unités', category: 'Organisation', keywords: 'unité liste effectif matricule steam' },
    { url: 'carte.html', title: 'Carte de Cité 17', category: 'Géographie', keywords: 'carte map cité 17 district secteur nexus plaza gare zone' },
    { url: 'scanner.html', title: 'Scanner & Central', category: 'Outils', keywords: 'scanner central vérification identité civil citoyen' },
    { url: 'about.html', title: 'À Propos', category: 'Info', keywords: 'à propos information site crédit' },
    { url: 'contact.html', title: 'Contact', category: 'Info', keywords: 'contact aide support' },
    { url: 'liens.html', title: 'Liens Utiles', category: 'Info', keywords: 'liens utile ressource discord steam' },
    { url: 'declarations.html', title: 'Déclarations', category: 'Formulaires', keywords: 'déclaration formulaire rapport' },
    // Activité
    { url: 'activite.html', title: 'Activité', category: 'Activité', keywords: 'activité viewtime temps de jeu semaine présence' },
    { url: 'activite-tableaux.html', title: 'Tableaux d\'Activité', category: 'Activité', keywords: 'tableau activité milice statistique' },
    { url: 'worker-announcement.html', title: 'Annonces', category: 'Activité', keywords: 'annonce worker citoyen travailleur' },
    { url: 'ration-announcement.html', title: 'Distribution Rations', category: 'Activité', keywords: 'ration distribution nourriture eau' },
    { url: 'suspended-rations.html', title: 'Rations Suspendues', category: 'Activité', keywords: 'ration suspendue suspension punition' },
    { url: 'social-infraction.html', title: 'Infractions Sociales', category: 'Activité', keywords: 'infraction sociale violation comportement' },
    { url: 'pending.html', title: 'En Attente', category: 'Activité', keywords: 'en attente pending validation' },
    // Guide
    { url: 'guide.html', title: 'Guide Général', category: 'Guide', keywords: 'guide général introduction' },
    { url: 'guide-vestimentaire.html', title: 'Code Vestimentaire', category: 'Guide', keywords: 'vestimentaire uniforme tenue masque' },
    { url: 'guide-terminologie.html', title: 'Terminologie', category: 'Guide', keywords: 'terminologie vocabulaire terme code 10 signal' },
    { url: 'guide-respect.html', title: 'Respect & Salutations', category: 'Guide', keywords: 'respect salutation salut protocole' },
    { url: 'guide-dispatch.html', title: 'Dispatch & Haut-Parleur', category: 'Guide', keywords: 'dispatch haut-parleur annonce radio communication' },
    { url: 'guide-commandement.html', title: 'Commandement', category: 'Guide', keywords: 'commandement leader officier commandant' },
    { url: 'guide-sociostatus.html', title: 'Socio-Status', category: 'Guide', keywords: 'socio status social civil citoyen anti-citoyen' },
    { url: 'guide-breches.html', title: 'Brèches de Protocoles', category: 'Guide', keywords: 'brèche protocole violation sanction disciplinaire' },
    { url: 'guide-formations.html', title: 'Formations Complémentaires', category: 'Guide', keywords: 'formation complémentaire spécialisation entraînement' },
    // Cours
    { url: 'cours.html', title: 'Cours Théoriques', category: 'Formation', keywords: 'cours théorique formation examen' },
    { url: 'cours-rct.html', title: 'Cours RCT', category: 'Formation', keywords: 'cours rct recrue recruit formation base' },
    { url: 'cours-05.html', title: 'Cours 05+', category: 'Formation', keywords: 'cours 05 officier avancé' },
    { url: 'cours-03.html', title: 'Cours 03+', category: 'Formation', keywords: 'cours 03 commandement supérieur' },
    // Procédures
    { url: 'procedures.html', title: 'Procédures', category: 'Procédures', keywords: 'procédure protocole' },
    { url: 'procedures-generales.html', title: 'Procédures Générales', category: 'Procédures', keywords: 'procédure générale' },
    { url: 'procedure-conscription.html', title: 'Conscription', category: 'Procédures', keywords: 'conscription recrutement nouveau civil enrôlement' },
    { url: 'test-loyaute.html', title: 'Test de Loyauté', category: 'Procédures', keywords: 'test loyauté interrogatoire vérification fidélité' },
    { url: 'procedure-incarceration.html', title: 'Incarcération', category: 'Procédures', keywords: 'incarcération prison cellule détention' },
    { url: 'procedure-dispatch-admin.html', title: 'Dispatch Administrateur', category: 'Procédures', keywords: 'dispatch administrateur gestion' },
    { url: 'procedure-code7.html', title: 'Code 7 / Escouade', category: 'Procédures', keywords: 'code 7 escouade raid opération militaire' },
    { url: 'judgement-waiver.html', title: 'Dérogation Jugement', category: 'Procédures', keywords: 'dérogation jugement waiver exception' },
    // CWU
    { url: 'cwu.html', title: 'CWU', category: 'CWU', keywords: 'cwu civil workers union union travailleur civil' },
    { url: 'cwu-procedure.html', title: 'Procédure CWU', category: 'CWU', keywords: 'cwu procédure protocole travailleur' },
    { url: 'conscription.html', title: 'Conscription', category: 'Recrutement', keywords: 'conscription rejoindre mpf recrutement candidature' },
  ];

  function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function search(query) {
    if (!query || query.length < 2) return [];
    const terms = normalize(query).split(/\s+/).filter(t => t.length >= 2);
    if (terms.length === 0) return [];

    const results = [];
    for (const page of PAGES_INDEX) {
      const haystack = normalize(page.title + ' ' + page.keywords + ' ' + page.category);
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) {
          score += term.length;
          // Boost for title match
          if (normalize(page.title).includes(term)) score += 5;
        }
      }
      if (score > 0) {
        results.push({ ...page, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }

  function init() {
    const input = document.getElementById('site-search');
    const resultsDiv = document.getElementById('search-results');
    if (!input || !resultsDiv) return;

    input.addEventListener('input', function() {
      const q = this.value.trim();
      const results = search(q);

      if (results.length === 0) {
        resultsDiv.style.display = q.length >= 2 ? 'block' : 'none';
        resultsDiv.innerHTML = q.length >= 2 
          ? '<div style="padding: 0.6rem 1rem; color: var(--text-muted); font-size: 0.85rem;">Aucun résultat trouvé.</div>' 
          : '';
        return;
      }

      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = results.map(r => 
        `<a href="${r.url}">
          ${r.title}
          <span class="search-category">${r.category}</span>
        </a>`
      ).join('');
    });

    input.addEventListener('blur', function() {
      setTimeout(() => { resultsDiv.style.display = 'none'; }, 200);
    });

    input.addEventListener('focus', function() {
      if (this.value.trim().length >= 2) {
        resultsDiv.style.display = 'block';
      }
    });

    // Keyboard shortcut: Ctrl+K or /
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
