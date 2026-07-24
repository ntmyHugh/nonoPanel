let currentPage = 0;  // Start with first page (index 0)
const totalPages = 2;
let isScrolling = false;

function switchToPage(pageIndex) {
  console.log(`Switching to page: ${pageIndex}, current: ${currentPage}`);
  if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) return;

  // Update pages
  const pages = document.querySelectorAll('.page-content');
  console.log(`Found ${pages.length} pages:`, Array.from(pages).map(p => p.id));

  pages.forEach((page, index) => {
    const isActive = index === pageIndex;
    const wasActive = page.classList.contains('active');
    page.classList.toggle('active', isActive);
    console.log(`Page ${index} (${page.id}): ${wasActive ? 'was active' : 'was inactive'} -> ${isActive ? 'now active' : 'now inactive'}`);
  });

  // Update indicators
  document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === pageIndex);
  });

  currentPage = pageIndex;
  document.dispatchEvent(new CustomEvent('page:changed', { detail: { pageIndex } }));
}

// Wheel event for page switching
document.addEventListener('wheel', (e) => {
  if (isScrolling) return;

  isScrolling = true;
  setTimeout(() => { isScrolling = false; }, 500);

  if (e.deltaY > 0 && currentPage < totalPages - 1) {
    // Scroll down - next page
    switchToPage(currentPage + 1);
  } else if (e.deltaY < 0 && currentPage > 0) {
    // Scroll up - previous page
    switchToPage(currentPage - 1);
  }
});

// Click indicators to switch pages
document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
  dot.addEventListener('click', () => {
    switchToPage(index);
  });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    if (currentPage < totalPages - 1) switchToPage(currentPage + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    if (currentPage > 0) switchToPage(currentPage - 1);
  }
});