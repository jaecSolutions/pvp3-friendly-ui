(function () {
  if (document.querySelector('.hero-wrap')) {
    return;
  }

  var path = window.location.pathname || '';
  var parts = path.split('/').filter(Boolean);
  var frIndex = parts.indexOf('fr');
  var afterFr = frIndex >= 0 ? parts.slice(frIndex + 1) : [];
  var tail = afterFr.length ? afterFr[afterFr.length - 1] : '';
  var isHtmlFile = /\.html?$/i.test(tail);
  var dirDepth = afterFr.length === 0 ? 0 : (isHtmlFile ? afterFr.length - 1 : afterFr.length);
  var up = '../'.repeat(Math.max(0, dirDepth));
  var frRoot = up;

  var links = {
    home: frRoot + 'index.html',
    mission: frRoot + 'mission-et-biographie.html',
    concerts: frRoot + 'nos-prochains-concerts-et-prestations.html',
    inscriptions: frRoot + 'inscriptions.html',
    contact: frRoot + 'nous-joindre.html'
  };

  document.body.classList.add('friendly-shell');

  var header = document.createElement('header');
  header.className = 'friendly-shell-header';
  header.innerHTML =
    '<div class="friendly-shell-header__inner">' +
    '<a class="friendly-shell-brand" href="' + links.home + '">' +
    '<strong>Les Petites Voix du Plateau</strong>' +
    '<span>Une famille de choeurs de 6 a 24 ans</span>' +
    '</a>' +
    '<nav class="friendly-shell-nav" aria-label="Navigation principale">' +
    '<a href="' + links.home + '">Accueil</a>' +
    '<a href="' + links.mission + '">Mission</a>' +
    '<a href="' + links.concerts + '">Concerts</a>' +
    '<a href="' + links.inscriptions + '">Inscriptions</a>' +
    '<a href="' + links.contact + '">Contact</a>' +
    '</nav>' +
    '</div>';

  var footer = document.createElement('footer');
  footer.className = 'friendly-shell-footer';
  footer.innerHTML =
    '<div class="friendly-shell-footer__inner">' +
    '<p>Les Petites Voix du Plateau</p>' +
    '<p><a href="' + links.contact + '">Nous contacter</a></p>' +
    '</div>';

  document.body.insertBefore(header, document.body.firstChild);
  document.body.appendChild(footer);
})();
