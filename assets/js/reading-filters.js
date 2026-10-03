(() => {
  const filters = document.querySelector('.reading-filters');
  const status = document.querySelector('.reading-filter-status');
  const buttons = filters.querySelectorAll('[data-reading-filter]');
  const cards = document.querySelectorAll('#reading-list [data-reading-group]');

  function selectFilter(selected) {
    let count = 0;

    for (const card of cards) {
      card.hidden =
        selected.dataset.readingFilter !== 'all' &&
        card.dataset.readingGroup !== selected.dataset.readingFilter;
      if (!card.hidden) count++;
    }

    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button === selected));
    }

    status.textContent = `Showing ${count} of ${cards.length} books`;
  }

  for (const button of buttons) {
    button.addEventListener('click', () => selectFilter(button));
  }

  selectFilter(filters.querySelector('[data-reading-filter="all"]'));
  filters.hidden = false;
  status.hidden = false;
})();
