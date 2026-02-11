/* ============================================================
   COMBINE OVERWATCH - DYNAMIC VISUAL EFFECTS ENGINE
   Data rain, terminal typing, particle effects
   ============================================================ */

(function() {
  'use strict';

  // ==================== DATA RAIN EFFECT ====================
  function initDataRain() {
    const containers = document.querySelectorAll('.data-stream');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
    
    containers.forEach(container => {
      const width = container.offsetWidth;
      const colCount = Math.floor(width / 14);
      
      for (let i = 0; i < colCount; i++) {
        const col = document.createElement('div');
        col.className = 'data-stream-col';
        col.style.left = (i * 14) + 'px';
        col.style.animationDuration = (3 + Math.random() * 5) + 's';
        col.style.animationDelay = -(Math.random() * 5) + 's';
        col.style.opacity = 0.1 + Math.random() * 0.4;
        
        let text = '';
        const len = 10 + Math.floor(Math.random() * 15);
        for (let j = 0; j < len; j++) {
          text += chars[Math.floor(Math.random() * chars.length)] + '\n';
        }
        col.textContent = text;
        container.appendChild(col);
      }
    });
  }

  // ==================== TERMINAL TYPING EFFECT ====================
  function initTypingTerminals() {
    const terminals = document.querySelectorAll('.typing-terminal[data-lines]');

    terminals.forEach(terminal => {
      const lines = JSON.parse(terminal.dataset.lines);
      const speed = parseInt(terminal.dataset.speed) || 50;
      const lineDelay = parseInt(terminal.dataset.lineDelay) || 800;
      
      terminal.innerHTML = '';
      
      let lineIndex = 0;

      function typeLine() {
        if (lineIndex >= lines.length) {
          // Add blinking cursor at end
          const cursor = document.createElement('span');
          cursor.className = 'typing-cursor';
          terminal.appendChild(cursor);
          return;
        }

        const line = lines[lineIndex];
        const lineEl = document.createElement('div');
        lineEl.className = 'typing-line';
        lineEl.style.animationDelay = (lineIndex * (lineDelay / 1000)) + 's';
        terminal.appendChild(lineEl);

        let charIndex = 0;
        function typeChar() {
          if (charIndex < line.length) {
            lineEl.textContent += line[charIndex];
            charIndex++;
            setTimeout(typeChar, speed + Math.random() * 30);
          } else {
            lineIndex++;
            setTimeout(typeLine, lineDelay);
          }
        }
        typeChar();
      }

      // Start with delay based on visibility
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(typeLine, 500);
            observer.unobserve(terminal);
          }
        });
      }, { threshold: 0.3 });
      
      observer.observe(terminal);
    });
  }

  // ==================== LIVE COUNTER EFFECT ====================
  function initLiveCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    counters.forEach(counter => {
      const target = parseInt(counter.dataset.counter);
      const duration = parseInt(counter.dataset.duration) || 2000;
      const prefix = counter.dataset.prefix || '';
      const suffix = counter.dataset.suffix || '';
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(counter, target, duration, prefix, suffix);
            observer.unobserve(counter);
          }
        });
      }, { threshold: 0.5 });
      
      observer.observe(counter);
    });
  }

  function animateCounter(el, target, duration, prefix, suffix) {
    const start = performance.now();
    
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.floor(eased * target);
      
      el.textContent = prefix + value.toLocaleString() + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  // ==================== RANDOM GLITCH EFFECT ====================
  function initGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch-text');
    
    glitchElements.forEach(el => {
      if (!el.dataset.text) {
        el.dataset.text = el.textContent;
      }
    });

    // Periodic random extra glitch
    setInterval(() => {
      glitchElements.forEach(el => {
        if (Math.random() > 0.7) {
          el.style.textShadow = `${Math.random() * 4 - 2}px 0 #ff0040, ${Math.random() * 4 - 2}px 0 #00aaff`;
          setTimeout(() => {
            el.style.textShadow = '';
          }, 100 + Math.random() * 150);
        }
      });
    }, 3000);
  }

  // ==================== PARTICLE CANVAS BACKGROUND ====================
  function initParticles() {
    const canvas = document.querySelector('#particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        life: Math.random() * 200 + 100,
        maxLife: 0
      };
    }

    function init() {
      resize();
      particles = [];
      const count = Math.min(Math.floor((width * height) / 15000), 60);
      for (let i = 0; i < count; i++) {
        const p = createParticle();
        p.maxLife = p.life;
        particles.push(p);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles[i] = createParticle();
          particles[i].maxLife = particles[i].life;
          return;
        }

        const fadeRatio = p.life / p.maxLife;
        const alpha = p.opacity * fadeRatio;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 170, 255, ${alpha})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 170, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
      resize();
    });

    init();
    draw();
  }

  // ==================== STATUS TICKER ====================
  function initStatusTicker() {
    const tickers = document.querySelectorAll('.status-ticker');

    tickers.forEach(ticker => {
      const messages = JSON.parse(ticker.dataset.messages || '[]');
      if (messages.length === 0) return;

      let index = 0;
      const display = document.createElement('span');
      display.className = 'ticker-text';
      ticker.appendChild(display);

      function showNext() {
        display.style.opacity = '0';
        display.style.transform = 'translateY(5px)';
        
        setTimeout(() => {
          display.textContent = messages[index];
          display.style.opacity = '1';
          display.style.transform = 'translateY(0)';
          index = (index + 1) % messages.length;
        }, 300);
      }

      display.style.transition = 'opacity 0.3s, transform 0.3s';
      showNext();
      setInterval(showNext, 4000);
    });
  }

  // ==================== SCROLL REVEAL ====================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // ==================== FLOATING HEX PARTICLES ====================
  function initFloatingHex() {
    const containers = document.querySelectorAll('.floating-hex-bg');
    
    containers.forEach(container => {
      for (let i = 0; i < 6; i++) {
        const hex = document.createElement('div');
        hex.style.cssText = `
          position: absolute;
          width: ${20 + Math.random() * 40}px;
          height: ${20 + Math.random() * 40}px;
          border: 1px solid rgba(0, 170, 255, ${0.03 + Math.random() * 0.05});
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: floatHex ${8 + Math.random() * 8}s ease-in-out infinite;
          animation-delay: ${-Math.random() * 8}s;
          pointer-events: none;
        `;
        container.appendChild(hex);
      }
    });
  }

  // Add floating hex keyframes dynamically
  const floatStyle = document.createElement('style');
  floatStyle.textContent = `
    @keyframes floatHex {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
      25% { transform: translateY(-15px) rotate(5deg); opacity: 0.6; }
      50% { transform: translateY(-8px) rotate(-3deg); opacity: 0.4; }
      75% { transform: translateY(-20px) rotate(2deg); opacity: 0.5; }
    }
    .reveal-on-scroll {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .reveal-on-scroll.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    .ticker-text {
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.75rem;
      display: inline-block;
    }
  `;
  document.head.appendChild(floatStyle);

  // ==================== INIT ALL ====================
  function initAll() {
    initDataRain();
    initTypingTerminals();
    initLiveCounters();
    initGlitchEffects();
    initParticles();
    initStatusTicker();
    initScrollReveal();
    initFloatingHex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
