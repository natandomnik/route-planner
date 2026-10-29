'use strict';
// Stable identifiers are persisted in routeSettings.modules. Existing installs keep all features enabled.
const ROUTE_MODULES = Object.freeze({
  timocom: {label: 'Przyciski trasy w TimoCom', defaultEnabled: true},
  suggestionMap: {label: 'Interaktywna mapa sugestii', defaultEnabled: true},
  recognitionHistory: {label: 'Lokalna historia rozpoznawania i korekt', defaultEnabled: true},
  aiExtraction: {label: 'Rozpoznawanie trasy przez AI', defaultEnabled: true},
  postalLookup: {label: 'Sprawdzanie kodów przy kopiowaniu', defaultEnabled: true},
  hubSuggestions: {label: 'Sugestie obszarów przy A/B', defaultEnabled: true},
  postalLab: {label: 'Eksperymentalny test kodów', defaultEnabled: true}
});
function normalizeRouteModules(saved = {}) {
  return Object.fromEntries(Object.entries(ROUTE_MODULES).map(([id, module]) => [id,
    typeof saved?.[id] === 'boolean' ? saved[id] : module.defaultEnabled]));
}
if (typeof module !== 'undefined' && module.exports) module.exports = {ROUTE_MODULES, normalizeRouteModules};
