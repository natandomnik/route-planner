# Suggestion map

Optional `suggestionMap` module. Bundled Leaflet 1.9.4 (BSD-2-Clause, license under `vendor/`) renders Geoapify raster tiles with visible OpenStreetMap/Geoapify attribution. No remote executable scripts or AI-generated map coordinates.

## Entry points and functions

- `map.js`: `SuggestionMap.update` receives ordered route points and role-tagged suggestions; `open` creates the map or hands a small popup snapshot to a full extension tab; `close` aborts work and releases layers; `highlight` emphasizes a suggestion and its road; `resetDistance` clears pending distance state. Internal `locate`, `road`, `updateDistance` and the serialized append queue handle geocoding, driving geometry, caching and incremental updates.
- `location-validation.js`: `expected` normalizes address components, `parameters` builds structured/free-form requests, and `matches` validates coordinates and address identity.
- `context.js`: `addMapContext` creates country boundaries and viewport/zoom-filtered city, logistics and parking layers.
- `context-data.js`, `logistics-data.js`, `parking-data.js`: static geography with provenance and limitations in `CONTEXT-DATA.md`.
- `map.css`: panel, markers, tooltips, context labels and distance badges.

## Settings, network and lifecycle

`routeSettings.modules.suggestionMap` defaults to enabled. `mapApiKey` is stored independently in local storage and is never exported in history. Fixed hosts: `api.geoapify.com` for geocoding/routing and `maps.geoapify.com` for tiles. With the module enabled and a key configured, two or more recognized points trigger a debounced driving-distance request even before the map opens. Map opening loads tiles and suggestion roads. Disabling the module or changing/invalidating a route discards pending work. Key changes close the map and reset distance.

The main road is blue with directional arrows. Suggestion points/roads are red, changing to green on hover; A/B markers have hover-only labels. New suggestions on the same route append without replacing existing map instances, tiles, markers, road geometry or viewport. Route/strategy changes rebuild and abort the old queue. Demo suggestions are excluded from real geocoding.

## Address and coordinate contracts

Leaflet receives validated `[latitude, longitude]` coordinates. Simple inputs are split into Geoapify `country`, `postcode` and `city` parameters, plus ISO country filter and `bias=countrycode:none`. Country prefixes/suffixes, postal-only inputs, trailing postcodes and Polish/Czech spaced codes are supported. Two-digit DE/PL freight prefixes are not full postcodes. Street addresses remain free-form; structured and free-form parameters are never mixed. Failed structured lookups may retry original text with identical validation. Ambiguous results are omitted. Selected localized city aliases are country-scoped.

Geocoding is sequential with spacing, cancellation, timeouts and a validated 30-day v3 local cache. Driving routes use `lat,lon|lat,lon` waypoints; returned GeoJSON `[longitude, latitude]` geometry is explicitly converted to Leaflet order. Road geometry has an in-memory bounded cache. Missing points/routes are reported, not replaced by invented coordinates or straight-line distances. Provider metres become kilometre badges in the planner and map.

Routes use car driving mode, not truck restrictions. Static parking coordinates are references, not certified entrance points or live occupancy. LLM suggestion distances remain estimates independent of the road-distance badge.

## Validation

`tests/map-location.test.cjs` covers normalization, matching and incorrect results. `tests/suggestion-map.browser.cjs` mocks geocoding, routing and tiles, verifying retained layers, distance, highlighting, module disabling and caching. Automated tests make no live API requests.

References: https://apidocs.geoapify.com/docs/geocoding/ and https://leafletjs.com/reference.html#latlng
