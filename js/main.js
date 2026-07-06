/**
 * Photographer Portfolio - Global JavaScript
 * Handles theme toggling, mobile navigation, active link detection, and scroll transitions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  highlightActiveLink();
  initScrollAnimations();
});

/**
 * Initialize Light/Dark Theme Controller
 */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Check saved preference or fallback to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  // Apply initial theme
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Click Handler
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Dispatch custom event so gallery or other pages can adapt if needed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  });
}

/**
 * Handle Mobile Drawer Toggle
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBtn.classList.toggle('open');
    navLinks.classList.toggle('open');
    
    // Toggle aria state for accessibility
    const isOpen = toggleBtn.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close menu if user clicks outside
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleBtn.classList.remove('open');
      navLinks.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    }
  });

  // Close menu on resize to desktop dimensions
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('open')) {
      toggleBtn.classList.remove('open');
      navLinks.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    }
  });
}

/**
 * Highlighting Current Navigation Item
 */
function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Basic matching: ends with, or is exactly the path
    if (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Intersection Observer for scroll animation transitions
 */
function initScrollAnimations() {
  // Elements that should fade in
  const animatedElements = document.querySelectorAll('.work-card, .about-details, .about-portrait-frame, .hero-content, .hero-image-frame, .contact-info, .contact-form');
  
  // Set initial hidden state (via inline styles to be robust without extra CSS bloat)
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        obs.unobserve(el); // Stop observing once triggered
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

/**
 * Global fallback for missing/unpopulated images
 */
window.handleImageError = function(imgElement, title, category) {
  const mediaContainer = imgElement.parentElement;
  if (!mediaContainer) return;
  
  // Create beautiful placeholder replacement with photographer motif
  const fallback = document.createElement('div');
  fallback.className = 'image-fallback';
  
  // Set distinct pastel tints based on category to make it feel human and curated
  let hue = 30; // Terracotta / warm orange default
  if (category === 'Portrait') hue = 10;
  if (category === 'Landscape') hue = 160; // sage green
  if (category === 'Still Life') hue = 40; // warm cream
  if (category === 'Street') hue = 220; // dark blue
  if (category === 'Nature') hue = 120; // dark green
  if (category === 'Travel') hue = 320; // soft rose

  fallback.style.background = `linear-gradient(135deg, hsl(${hue}, 20%, 93%) 0%, hsl(${hue}, 15%, 83%) 100%)`;
  
  // Dark mode adjustment
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    fallback.style.background = `linear-gradient(135deg, hsl(${hue}, 12%, 14%) 0%, hsl(${hue}, 10%, 9%) 100%)`;
  }

  // Draw icon
  fallback.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" width="36" height="36">
      <path stroke-linecap="round" stroke-linejoin='round' d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
    <span>${title}</span>
  `;

  // Remove the image element and append fallback
  imgElement.remove();
  mediaContainer.appendChild(fallback);
};
