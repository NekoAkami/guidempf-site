/* ============================================================
   SITE SEARCH ENGINE - Recherche dans la documentation MPF
   ============================================================ */
(function() {
  'use strict';

  // Index des pages du site avec mots-clés
  const PAGES_INDEX = [
    { url: 'index.html', title: 'Accueil', category: 'Navigation', keywords: 'accueil page principale documentation combine nexus' },
    { url: 'hierarchie.html', title: 'Hiérarchie', category: 'Organisation', keywords: 'grade rang promotion organigramme commandement officier trooper recruit recrue rct i1 i2 i3 i4 i5 01 02 03 04 05 epu helix jury grid nova dvl ofc cmdr ranks classement' },
    { url: 'radio.html', title: 'Radio & Mots de Passe', category: 'Communication', keywords: 'radio fréquence mot de passe mdp communication dispatch 10-codes frequence canal channel' },
    { url: 'loyalisme.html', title: 'Loyalisme', category: 'Citoyens', keywords: 'loyalisme loyauté brassard citoyen suspect solidaire loyal distingué exemplaire niveau couleur vert jaune rouge' },
    { url: 'jugement.html', title: 'Jugement', category: 'Justice', keywords: 'jugement verdict peine cycle rééducation récidive sanction tribunal proportionnalité amputé' },
    { url: 'contrebande.html', title: 'Contrebande', category: 'Infractions', keywords: 'contrebande objet interdit arme drogue résistance niveau contraband items interdits confiscation' },
    { url: 'codex.html', title: 'Codex Radio', category: 'Législation', keywords: 'codex code loi règle officiel combine directive 10-4 10-8 10-20 10-42 10-50 10-78 10-99 radio codes localisation' },
    { url: 'equipment.html', title: 'Équipement', category: 'Matériel', keywords: 'équipement arme pistolet smg shotgun stunstick menottes radio gilet armure weapon loadout' },
    { url: 'divisions.html', title: 'Divisions', category: 'Organisation', keywords: 'division helix epu grid nova jury union spécialisation medic ingénieur engineer' },
    { url: 'tactics.html', title: 'Tactiques', category: 'Opérations', keywords: 'tactique formation combat raid breach escouade couverture flashbang grenade cqb' },
    { url: 'units.html', title: 'Unités', category: 'Organisation', keywords: 'unité liste effectif matricule steam roster personnel' },
    { url: 'carte.html', title: 'Carte de Cité 17', category: 'Géographie', keywords: 'carte map cité 17 district secteur nexus plaza gare zone cch canaux outlands' },
    { url: 'scanner.html', title: 'Scanner & Central', category: 'Outils', keywords: 'scanner central vérification identité civil citoyen cid check controle' },
    { url: 'about.html', title: 'À Propos', category: 'Info', keywords: 'à propos information site crédit a propos' },
    { url: 'contact.html', title: 'Contact', category: 'Info', keywords: 'contact aide support' },
    { url: 'liens.html', title: 'Liens Utiles', category: 'Info', keywords: 'liens utile ressource discord steam serveur' },
    { url: 'declarations.html', title: 'Déclarations', category: 'Formulaires', keywords: 'déclaration formulaire rapport report form' },
    // Activité
    { url: 'activite.html', title: 'Activité', category: 'Activité', keywords: 'activité viewtime temps de jeu semaine présence heures hours' },
    { url: 'activite-tableaux.html', title: 'Tableaux d\'Activité Milice', category: 'Activité', keywords: 'tableau activité milice statistique stats google sheet' },
    { url: 'worker-announcement.html', title: 'Worker Announcement', category: 'Activité', keywords: 'annonce worker citoyen travailleur announcement' },
    { url: 'ration-announcement.html', title: 'Distribution Rations', category: 'Activité', keywords: 'ration distribution nourriture eau food water' },
    { url: 'suspended-rations.html', title: 'Rations Suspendues', category: 'Activité', keywords: 'ration suspendue suspension punition ban' },
    { url: 'social-infraction.html', title: 'Infractions Sociales', category: 'Activité', keywords: 'infraction sociale violation comportement social' },
    { url: 'pending.html', title: 'En Attente', category: 'Activité', keywords: 'en attente pending validation approbation' },
    // Guide
    { url: 'guide.html', title: 'Guide Général', category: 'Guide', keywords: 'guide général introduction métropol police force mpf base' },
    { url: 'guide-vestimentaire.html', title: 'Code Vestimentaire', category: 'Guide', keywords: 'vestimentaire uniforme tenue masque apparence skin modèle model habit' },
    { url: 'guide-terminologie.html', title: 'Terminologie', category: 'Guide', keywords: 'terminologie vocabulaire terme code 10 signal lexique dictionnaire mot' },
    { url: 'guide-respect.html', title: 'Respect & Salutations', category: 'Guide', keywords: 'respect salutation salut protocole saluer supérieur hierarchie' },
    { url: 'guide-dispatch.html', title: 'Dispatch & Haut-Parleur', category: 'Guide', keywords: 'dispatch haut-parleur annonce radio communication hp speaker' },
    { url: 'guide-commandement.html', title: 'Commandement', category: 'Guide', keywords: 'commandement leader officier commandant ordre leadership diriger' },
    { url: 'guide-sociostatus.html', title: 'Socio-Status', category: 'Guide', keywords: 'socio status social civil citoyen anti-citoyen loyal suspect anti' },
    { url: 'guide-breches.html', title: 'Brèches de Protocoles', category: 'Guide', keywords: 'brèche protocole violation sanction disciplinaire erreur faute punition' },
    { url: 'guide-formations.html', title: 'Formations Complémentaires', category: 'Guide', keywords: 'formation complémentaire spécialisation entraînement training cours avancé' },
    // Cours
    { url: 'cours.html', title: 'Cours Théoriques', category: 'Formation', keywords: 'cours théorique formation examen test évaluation' },
    { url: 'cours-rct.html', title: 'Cours RCT', category: 'Formation', keywords: 'cours rct recrue recruit formation base nouveau débutant' },
    { url: 'cours-05.html', title: 'Cours 05+', category: 'Formation', keywords: 'cours 05 officier avancé intermédiaire' },
    { url: 'cours-03.html', title: 'Cours 03+', category: 'Formation', keywords: 'cours 03 commandement supérieur haut grade' },
    // Procédures
    { url: 'procedures.html', title: 'Procédures', category: 'Procédures', keywords: 'procédure protocole marche à suivre' },
    { url: 'procedures-generales.html', title: 'Procédures Générales', category: 'Procédures', keywords: 'procédure générale aperçu sommaire' },
    { url: 'procedure-conscription.html', title: 'Conscription', category: 'Procédures', keywords: 'conscription recrutement nouveau civil enrôlement rejoindre candidature postuler' },
    { url: 'test-loyaute.html', title: 'Test de Loyauté', category: 'Procédures', keywords: 'test loyauté interrogatoire vérification fidélité questioning' },
    { url: 'procedure-incarceration.html', title: 'Incarcération', category: 'Procédures', keywords: 'incarcération prison cellule détention prisonnier enfermement detention' },

    { url: 'procedure-code7.html', title: 'Code 7 / Escouade', category: 'Procédures', keywords: 'code 7 escouade raid opération militaire rassemblement squad' },
    { url: 'judgement-waiver.html', title: 'Dérogation Jugement', category: 'Procédures', keywords: 'dérogation jugement waiver exception exonération' },
    // CWU
    { url: 'cwu.html', title: 'CWU', category: 'CWU', keywords: 'cwu civil workers union union travailleur civil business commerce' },
    { url: 'cwu-procedure.html', title: 'Procédure CWU', category: 'CWU', keywords: 'cwu procédure protocole travailleur interaction' },
    { url: 'conscription.html', title: 'Conscription Citoyens', category: 'Recrutement', keywords: 'conscription rejoindre mpf recrutement candidature postuler inscription' },
    // Formulaires
    { url: 'formulaires.html', title: 'Formulaires', category: 'Formulaires', keywords: 'formulaire form google rapport déclaration depense gain formation test' },
    { url: 'form-rapport.html', title: 'Rapport', category: 'Formulaires', keywords: 'rapport formulaire déclaration activité patrouille opération' },
    { url: 'form-test.html', title: 'Formulaire Test', category: 'Formulaires', keywords: 'test évaluation examen formulaire' },
    { url: 'form-formation.html', title: 'Formation', category: 'Formulaires', keywords: 'formation formateur session entraînement formulaire' },
    { url: 'formations.html', title: 'Formations des Unités', category: 'Rapports', keywords: 'formations unités historique session formateur résultat' },
  ];

  function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function search(query) {
    if (!query || query.length < 2) return [];
    const terms = normalize(query).split(/\s+/).filter(t => t.length >= 1);
    if (terms.length === 0) return [];

    const results = [];
    for (const page of PAGES_INDEX) {
      const titleNorm = normalize(page.title);
      const catNorm = normalize(page.category);
      const kwNorm = normalize(page.keywords);
      const haystack = titleNorm + ' ' + kwNorm + ' ' + catNorm;
      let score = 0;
      let allMatch = true;

      for (const term of terms) {
        if (haystack.includes(term)) {
          score += term.length;
          // Boost exact title match
          if (titleNorm.includes(term)) score += 8;
          // Boost category match
          if (catNorm.includes(term)) score += 3;
          // Boost for start-of-word match 
          if (haystack.includes(' ' + term) || haystack.startsWith(term)) score += 2;
        } else {
          allMatch = false;
        }
      }

      // Only include if ALL terms match (AND logic) or at least some match well
      if (allMatch && score > 0) {
        results.push({ ...page, score: score + 10 }); // Bonus for full match
      } else if (score > 0 && terms.length <= 2) {
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
