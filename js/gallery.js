/**
 * Photographer Portfolio - Gallery Optimization Engine
 * Implements batch rendering (infinite scroll), fast filter/search indexing,
 * dynamic image error fallbacks, and a touch-responsive lightbox with prefetching.
 */

// Gallery Configuration
const BATCH_SIZE = 36;

// Gallery State
let allImages = [];
let filteredImages = [];
let currentBatchIndex = 0;
let currentLightboxIndex = -1;
let activeCategory = 'All';
let searchQuery = '';
let currentSort = 'newest';

// Elements
let galleryGrid = null;
let sentinel = null;
let statusText = null;
let currentCountEl = null;
let totalCountEl = null;

// Lightbox Elements
let lightbox = null;
let lightboxImg = null;
let lightboxTitle = null;
let lightboxDesc = null;
let lightboxMeta = null;
let lightboxCategory = null;
let lightboxClose = null;
let lightboxPrev = null;
let lightboxNext = null;

// Touch Swipe State (for Lightbox)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Bind Elements
  galleryGrid = document.getElementById('gallery-grid');
  sentinel = document.getElementById('gallery-sentinel');
  statusText = document.getElementById('gallery-status-text');
  currentCountEl = document.getElementById('current-count');
  totalCountEl = document.getElementById('total-count');

  if (!galleryGrid) return; // Exit if not on the gallery page

  // Bind Lightbox
  lightbox = document.getElementById('lightbox');
  lightboxImg = document.getElementById('lightbox-image');
  lightboxTitle = document.getElementById('lightbox-title');
  lightboxDesc = document.getElementById('lightbox-desc');
  lightboxMeta = document.getElementById('lightbox-meta');
  lightboxCategory = document.getElementById('lightbox-category');
  lightboxClose = document.getElementById('lightbox-close');
  lightboxPrev = document.getElementById('lightbox-prev');
  lightboxNext = document.getElementById('lightbox-next');

  // Initialize Event Listeners
  initFilters();
  initSearch();
  initSort();
  initLightboxEvents();
  
  // Load Database
  loadGalleryData();
});

/**
 * Fetch and parse the gallery JSON database
 */
async function loadGalleryData() {
  showSpinner();
  try {
    const response = await fetch('data/gallery.json');
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.statusText}`);
    }
    allImages = await response.json();
    
    // Set initial filters
    filteredImages = [...allImages];
    updateCounts();
    
    // Sort and render the first batch
    applyFilteringAndSorting();
    initInfiniteScroll();
  } catch (error) {
    console.error('Error loading gallery database:', error);
    showErrorState('Unable to load gallery. Please verify data/gallery.json exists and is valid.');
  }
}

/**
 * Initialize Filters (Categories)
 */
function initFilters() {
  const filterBtns = document.querySelectorAll('.category-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.getAttribute('data-category');
      
      applyFilteringAndSorting();
    });
  });
}

/**
 * Initialize Live Search (Instant Input)
 */
function initSearch() {
  const searchInput = document.getElementById('gallery-search');
  if (!searchInput) return;

  // Debounce helper to avoid heavy execution while typing
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilteringAndSorting();
    }, 150); // 150ms debounce
  });
}

/**
 * Initialize Sorting
 */
function initSort() {
  const sortSelect = document.getElementById('gallery-sort');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilteringAndSorting();
  });
}

/**
 * Process active search, category filters, and sorting parameters, then reset view
 */
function applyFilteringAndSorting() {
  // 1. Filter by Category
  let results = allImages;
  if (activeCategory !== 'All') {
    results = results.filter(img => img.category === activeCategory);
  }

  // 2. Filter by Search Query (searches Title, Description, and Tags)
  if (searchQuery) {
    results = results.filter(img => {
      const matchTitle = img.title.toLowerCase().includes(searchQuery);
      const matchDesc = img.description.toLowerCase().includes(searchQuery);
      const matchTags = img.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return matchTitle || matchDesc || matchTags;
    });
  }

  // 3. Sort Results
  if (currentSort === 'newest') {
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (currentSort === 'oldest') {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (currentSort === 'alphabetical') {
    results.sort((a, b) => a.title.localeCompare(b.title));
  }

  // 4. Update state and reset rendering variables
  filteredImages = results;
  currentBatchIndex = 0;
  galleryGrid.innerHTML = '';
  
  updateCounts();

  if (filteredImages.length === 0) {
    showEmptyState();
  } else {
    hideSpinner();
    loadNextBatch();
  }
}

/**
 * Load and append a batch of images to the DOM
 */
function loadNextBatch() {
  const start = currentBatchIndex * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, filteredImages.length);

  if (start >= filteredImages.length) {
    statusText.textContent = "You've reached the end of the collection.";
    statusText.style.display = 'block';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let i = start; i < end; i++) {
    const item = filteredImages[i];
    const card = createCardElement(item, i);
    fragment.appendChild(card);
  }

  galleryGrid.appendChild(fragment);
  currentBatchIndex++;
  updateCounts();

  // If we still have space and items left, load more immediately (e.g. on huge screens)
  if (end < filteredImages.length && isSentinelInViewport()) {
    loadNextBatch();
  } else if (end >= filteredImages.length) {
    statusText.textContent = "You've reached the end of the collection.";
    statusText.style.display = 'block';
  } else {
    statusText.style.display = 'none';
  }
}

/**
 * Helper to generate a gallery card DOM node
 */
function createCardElement(item, absoluteIndex) {
  const card = document.createElement('div');
  card.className = 'work-card';
  card.setAttribute('data-id', item.id);
  card.setAttribute('data-index', absoluteIndex);
  
  // Set explicit dynamic aspect ratios to prevent layout shifts
  const aspectClass = `aspect-${item.aspectRatio || 'landscape'}`;

  // Image load error fallback handler: renders beautiful placeholder if file doesn't exist
  card.innerHTML = `
    <div class="work-card-media ${aspectClass}">
      <img src="${item.filename}" 
           alt="${item.title}" 
           loading="lazy"
           onerror="handleImageError(this, '${item.title}', '${item.category}')">
    </div>
    <div class="work-card-info">
      <div class="work-meta">
        <span class="work-category">${item.category}</span>
        <span>&bull;</span>
        <span>${formatDate(item.date)}</span>
      </div>
      <h3 class="work-card-title">${item.title}</h3>
      <p class="work-card-desc">${item.description}</p>
    </div>
  `;

  // Click handler to open lightbox
  card.addEventListener('click', () => {
    openLightbox(absoluteIndex);
  });

  return card;
}



/**
 * Initialize Intersection Observer for dynamic loading scroll-sentinel
 */
function initInfiniteScroll() {
  const observerOptions = {
    root: null,
    rootMargin: '200px', // Fetch early when user is close
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && filteredImages.length > 0) {
        loadNextBatch();
      }
    });
  }, observerOptions);

  observer.observe(sentinel);
}

/**
 * Check if the scroll sentinel is currently visible
 */
function isSentinelInViewport() {
  const rect = sentinel.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Manage status counters
 */
function updateCounts() {
  if (totalCountEl) totalCountEl.textContent = allImages.length;
  if (currentCountEl) {
    const displayed = Math.min(currentBatchIndex * BATCH_SIZE, filteredImages.length);
    currentCountEl.textContent = displayed;
  }
}

/**
 * Helper: Format dates (YYYY-MM-DD -> Month YYYY)
 */
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'long' };
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Status screens (Spinner, Empty, Error)
 */
function showSpinner() {
  statusText.innerHTML = '<div class="spinner"></div><span class="status-text">Loading catalog...</span>';
  statusText.style.display = 'flex';
}

function hideSpinner() {
  statusText.style.display = 'none';
}

function showEmptyState() {
  statusText.innerHTML = '<span class="status-text">No matches found for your search query or filters.</span>';
  statusText.style.display = 'block';
}

function showErrorState(msg) {
  statusText.innerHTML = `<span class="status-text" style="color: var(--accent-warm);">${msg}</span>`;
  statusText.style.display = 'block';
}

/* ==========================================================================
   Lightbox Architecture
   ========================================================================== */

function initLightboxEvents() {
  if (!lightbox) return;

  // Close triggers
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content-wrap')) {
      closeLightbox();
    }
  });

  // Prev/Next buttons
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });
  
  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  // Touch Swipe gestures (for mobile screens)
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });
}

function handleSwipeGesture() {
  const threshold = 55; // Swipe distance threshold
  const deltaX = touchEndX - touchStartX;
  
  if (deltaX > threshold) {
    // Swipe Right -> Show Previous
    navigateLightbox(-1);
  } else if (deltaX < -threshold) {
    // Swipe Left -> Show Next
    navigateLightbox(1);
  }
}

/**
 * Open Lightbox modal at specific index
 */
function openLightbox(index) {
  if (index < 0 || index >= filteredImages.length) return;
  
  currentLightboxIndex = index;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop background scrolling

  renderLightboxImage();
}

/**
 * Close Lightbox modal
 */
function closeLightbox() {
  lightbox.classList.remove('active');
  lightboxImg.classList.remove('loaded');
  lightboxTitle.parentElement.classList.remove('loaded');
  document.body.style.overflow = ''; // Restore scroll
  currentLightboxIndex = -1;
}

/**
 * Toggle lightbox index
 */
function navigateLightbox(direction) {
  let newIndex = currentLightboxIndex + direction;
  
  // Wrap around bounds check
  if (newIndex < 0) {
    newIndex = filteredImages.length - 1;
  } else if (newIndex >= filteredImages.length) {
    newIndex = 0;
  }

  // Remove classes to trigger smooth transition out
  lightboxImg.classList.remove('loaded');
  lightboxTitle.parentElement.classList.remove('loaded');

  currentLightboxIndex = newIndex;
  
  // Tiny timeout for smooth visual transition
  setTimeout(renderLightboxImage, 150);
}

/**
 * Bind and load image into Lightbox Viewport
 */
function renderLightboxImage() {
  const item = filteredImages[currentLightboxIndex];
  if (!item) return;

  // Pre-hide image so it fades in gracefully once loaded
  lightboxImg.src = '';
  
  // Setup loading listeners
  lightboxImg.onload = () => {
    lightboxImg.classList.add('loaded');
    lightboxTitle.parentElement.classList.add('loaded');
  };

  // If the image fails to load, handle it inside the lightbox
  lightboxImg.onerror = () => {
    lightboxImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%238f887f" stroke-width="1.2"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/%3E%3C/svg%3E';
    lightboxImg.classList.add('loaded');
    lightboxTitle.parentElement.classList.add('loaded');
  };

  // Bind meta tags
  lightboxImg.src = item.filename;
  lightboxImg.alt = item.title;
  
  lightboxTitle.textContent = item.title;
  lightboxDesc.textContent = item.description;
  lightboxCategory.textContent = item.category;
  
  const formattedDate = formatDate(item.date);
  lightboxMeta.innerHTML = `<span class="lightbox-category">${item.category}</span> &bull; <span>${formattedDate}</span>`;

  // Performance Enhancement: Prefetch adjacent images for snappy slide feeling
  prefetchAdjacentImages();
}

/**
 * Background prefetch of the next/prev images to ensure instant transitions
 */
function prefetchAdjacentImages() {
  const nextIdx = (currentLightboxIndex + 1) % filteredImages.length;
  const prevIdx = (currentLightboxIndex - 1 + filteredImages.length) % filteredImages.length;
  
  const nextImg = filteredImages[nextIdx];
  const prevImg = filteredImages[prevIdx];

  if (nextImg) {
    const img1 = new Image();
    img1.src = nextImg.filename;
  }
  if (prevImg) {
    const img2 = new Image();
    img2.src = prevImg.filename;
  }
}
