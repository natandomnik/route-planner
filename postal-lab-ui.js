'use strict';
const runButton = document.getElementById('run-postal-test');
const cancelButton = document.getElementById('cancel-postal-test');
const labStatus = document.getElementById('postal-test-status');
const labResults = document.getElementById('postal-test-results');
let labController = null;
for (const item of POSTAL_TEST_CASES) {
  const li = document.createElement('li'); li.textContent = item.input + ' — ' + item.expectation;
  document.getElementById('test-cases').append(li);
}
cancelButton.addEventListener('click', () => labController?.abort());
runButton.addEventListener('click', async () => {
  if (labController) return;
  const controller = new AbortController(); labController = controller;
  runButton.disabled = true; cancelButton.disabled = false; labResults.replaceChildren();
  labStatus.textContent = 'Wyszukiwanie źródeł dla 4 przykładów…';
  const started = performance.now(), timer = setTimeout(() => controller.abort(), 120000);
  try {
    const settings = await readRouteSettings();
    controller.signal.throwIfAborted();
    const rows = await runPostalTest(settings.profiles.groq.apiKey, controller.signal);
    controller.signal.throwIfAborted();
    for (const item of POSTAL_TEST_CASES) {
      const row = rows.find(r => r.id === item.id), section = document.createElement('section');
      const title = document.createElement('h2'); title.textContent = item.input;
      const address = document.createElement('p');
      address.textContent = (row.status === 'candidate' ? 'Propozycja do sprawdzenia: ' : 'Bez uzupełnienia: ') + [row.country, row.postcode, row.locality].filter(Boolean).join(' ');
      const reason = document.createElement('p'); reason.textContent = row.reason;
      section.append(title, address, reason);
      for (const source of row.sources) {
        const p = document.createElement('p'), a = document.createElement('a'); a.href = source.url;
        a.textContent = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        p.append(a, document.createTextNode(' — ' + source.evidence)); section.append(p);
      }
      labResults.append(section);
    }
    labStatus.textContent = 'Zakończono w ' + ((performance.now() - started) / 1000).toFixed(1) + ' s. Wyniki wymagają oceny; niczego nie zastosowano.';
  } catch (error) {
    labStatus.textContent = controller.signal.aborted ? 'Test anulowany lub przekroczono limit 120 s. Niczego nie zmieniono.' : error.message;
  } finally {
    clearTimeout(timer); labController = null; runButton.disabled = false; cancelButton.disabled = true;
  }
});
