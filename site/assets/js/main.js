/* ===================================
   Les Petites Voix du Plateau
   Main JavaScript
   =================================== */

// --- Mobile Nav Toggle ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navCta = document.querySelector('.nav-cta');

  if (toggle) {
    toggle.addEventListener('click', () => {
      navLinks?.classList.toggle('open');
      navCta?.classList.toggle('open');
      const isOpen = navLinks?.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Mobile dropdown toggles
  document.querySelectorAll('.nav-dropdown > span').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.nav-dropdown');
      parent?.classList.toggle('open');
    });
  });

  // Close nav on link click (mobile)
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 720) {
        navLinks?.classList.remove('open');
        navCta?.classList.remove('open');
      }
    });
  });

  // Active link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Accordion (FAQ) ---
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if it was closed)
      if (!isOpen) {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Newsletter form (placeholder) ---
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input?.value) {
        input.value = '';
        const btn = form.querySelector('button');
        const original = btn.textContent;
        btn.textContent = '✓ Merci !';
        btn.style.background = '#4ade80';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
        }, 3000);
      }
    });
  });

  // --- Contact form (placeholder) ---
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = '✓ Message envoyé !';
      btn.style.background = '#4ade80';
      btn.disabled = true;
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
