/* Microsoft Clarity: how the site is actually read (which sections people reach, where they stop).
 * Same approach as WildTrace:
 *   * the project id lives on <body data-clarity="...">; remove it and there is no tracking at all;
 *   * an explicit Global Privacy Control signal is honoured, and Clarity never loads;
 *   * advertising storage is always denied; analytics storage is the only consent given;
 *   * it loads after the page is idle, so it never slows the first read;
 *   * the footer says plainly that it runs, with a link to Microsoft's privacy statement.
 */
export function startAnalytics() {
  const id = document.body.dataset.clarity;
  if (!id) return;
  if (navigator.globalPrivacyControl) return;
  try {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    const page = document.body.dataset.page;
    if (page) window.clarity('set', 'page', page);
  } catch { /* blocked or offline: the site works exactly the same */ }
}
