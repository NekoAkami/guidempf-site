/* ============================================================
   ACCORDION SYSTEM - Toggle sections déroulantes
   ============================================================ */
(function() {
  'use strict';

  function init() {
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', function() {
        const section = this.closest('.accordion-section');
        const wasOpen = section.classList.contains('open');
        
        // Toggle current section
        section.classList.toggle('open');
        
        // Update aria
        this.setAttribute('aria-expanded', !wasOpen);
      });
    });

    // Open first section by default if specified
    document.querySelectorAll('.accordion-section[data-default-open]').forEach(section => {
      section.classList.add('open');
      const header = section.querySelector('.accordion-header');
      if (header) header.setAttribute('aria-expanded', 'true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
