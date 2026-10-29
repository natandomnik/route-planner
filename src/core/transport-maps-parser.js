/* Transport route text parser. Requires no APIs or libraries.
 * Standalone parser with browser globals and CommonJS exports.
 * parseAddresses(text) preserves the existing result: an array of strings.
 * parseTransportRoute(text) also returns warnings and omitted prefixes.
 */
const TransportMaps = (() => {
  const codes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW UK XK'.split(' ');
  const names = new Intl.DisplayNames(['en'], {type: 'region'});
  const countryName = c => names.of(c === 'UK' ? 'GB' : c);
  const countryStart = new RegExp('^(' + codes.join('|') + ')(?=\\d|[\\s,-]|$)[,\\s-]*', 'i');
  const countryEnd = new RegExp(',\\s*(' + codes.join('|') + ')$', 'i');
  // Validate format, not the existence of a code in a postal database.
  const formats = {
    PL: /^\d{2}-?\d{3}$/, DE: /^\d{5}$/, BE: /^\d{4}$/,
    CZ: /^\d{3}\s?\d{2}$/, SK: /^\d{3}\s?\d{2}$/,
    NL: /^\d{4}\s?[A-Z]{2}$/i, PT: /^\d{4}-\d{3}$/,
    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, US: /^\d{5}(?:-\d{4})?$/,
    JP: /^\d{3}-\d{4}$/, RO: /^\d{6}$/
  };
  for (const c of ['AT','CH','DK','NO','HU','BG','LU','SI']) formats[c] = /^\d{4}$/;
  for (const c of ['FR','ES','IT','FI','EE','HR','RS','UA']) formats[c] = /^\d{5}$/;
  for (const c of ['SE','GR']) formats[c] = /^\d{3}\s?\d{2}$/;
  formats.LV = /^(?:LV-)?\d{4}$/i;
  formats.LT = /^(?:LT-)?\d{5}$/i;

  const foldKey = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase().replace(/[\s_\-\d]/g, '');
  const loadKeys = new Set(['loading','loadingaddress','loadingplace','pickup','pickupaddress','collection','zaladunek','miejscezaladunku','adreszaladunku']);
  const unloadKeys = new Set(['unloading','unloadingaddress','unloadingplace','deliveryplace','delivery','deliveryaddress','dropoff','rozladunek','miejsce rozladunku','adresrozladunku'].map(foldKey));
  const metadataKeys = new Set(['loadingDate','unloadingDate','loadingTime','unloadingTime','pickupDate','deliveryDate','date','time','data','godzina','weight','waga','grossWeight','netWeight','quantity','ilosc','pallets','palety','ldm','adr','reference','referenceNumber','orderNumber','numerReferencyjny','nrZlecenia','cargo','ladunek','goods','towar','notes','uwagi','contact','kontakt','phone','telefon','email','price','cena','currency','waluta','vehicle','pojazd'].map(foldKey));

  // Read structure BEFORE removing dates and whitespace.
  function readFields(input) {
    const source = String(input ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/\*\*/g, '')
      .replace(new RegExp('^(delivery|unloading|loading|pickup) place[^\\n]*?\\bin\\s+(?=(?:' + codes.join('|') + ')[ ,\\d-])', 'gim'), '$1: ');
    // Support multiple fields on one line. A plain time such as 08:00 is not a key.
    const lines = source.replace(/([ \t;]+)((?:(?:loading|unloading|pickup|delivery)[ \t]+(?:date|time|address)|[\p{L}][\p{L}\d_-]*)[ \t]*:)(?!\/\/)/giu,
      (match, space, key, offset) => {
        const before = source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset);
        // Notes/descriptions may contain "delivery:"; do not turn it into a stop.
        if (/(?:^|\s)(?:notes|uwagi|cargo|goods|towar|description|opis)\s*:/i.test(before)) return match;
        return before.includes(':') ? '\n' + key : match;
      }).split('\n');
    const stops = [], ignoredFields = [], warnings = [], remainder = [];
    let current = null, collecting = false;
    for (const line of lines) {
      const field = line.match(/^\s*([\p{L}][\p{L}\d _-]{0,60})\s*:[ \t]*(.*)$/u);
      if (field) {
        const key = foldKey(field[1]), value = field[2].trim();
        if (loadKeys.has(key) || unloadKeys.has(key)) {
          current = {role: loadKeys.has(key) ? 'loading' : 'unloading', parts: value ? [value] : []};
          stops.push(current); collecting = true;
        } else {
          ignoredFields.push({key: field[1].trim(), value});
          if (!metadataKeys.has(key)) warnings.push('Pominięto nierozpoznane pole „' + field[1].trim() + '”. Sprawdź, czy nie zawiera części adresu.');
          collecting = false;
        }
      } else if (collecting && current) {
        current.parts.push(line);
      } else if (!stops.length) {
        remainder.push(line);
      } else if (line.trim() && normalize(line)) {
        warnings.push('Pominięto tekst poza polem adresowym: ' + line.trim());
      }
    }
    if (stops.length) {
      if (remainder.some(line => normalize(line))) stops.unshift({role: null, parts: remainder});
      return {stops, ignoredFields, warnings, structured: true};
    }
    return {text: remainder.join('\n'), ignoredFields, warnings, structured: false};
  }

  function normalize(text) {
    return String(text ?? '').normalize('NFC')
      .replace(/&#x20;|&#32;|&nbsp;/gi, ' ')
      .replace(/\r\n?/g, '\n').replace(/[\u00a0\u2002\u2003\t]/g, ' ')
      .replace(/\*\*/g, '').replace(/[–—]/g, '-')
      .replace(/\bsvg(?=\d|\s|$)/gi, ' ')
      .replace(/\b(?:zał|zal|rozł|rozl)\.[ \t]*/gi, ' ')
      .replace(/^[^\n]*\b(?:GmbH|Ltd\.?|B\.?V\.?|N\.?V\.?|Sp\. z o\.o\.)[ \t]*$/gim, '')
      .replace(/\([A-Z\d][A-Z\d .&-]{1,}\)/g, ' ')
      .replace(/[ \t]*\/[ \t]*$/gm, '')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
      .replace(/\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?(?:\s*-\s*\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?)?\b/g, ' ')
      .replace(/\(?\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*-\s*\d{1,2}:\d{2}(?::\d{2})?)?\)?/g, ' ')
      .split('\n').map(s => s.trim()).filter(s => s && !/^[-_=\\]+$/.test(s)).join('\n');
  }

  function split(text) {
    const countryNumeric = '(?:' + codes.join('|') + ')[, \t-]*\\d';
    const marked = text
      .replace(/\b(?:Załadunek|Rozładunek|Loading|Unloading|Pickup|Delivery)\b\s*\d*\s*:?/gi, '\n|\n')
      .replace(/\s*(?:->|[➞→⟶⇒➔➜►>]+|-{2,})\s*|\s+-\s+|(?:^|\s+)(?:do|to|then|potem|następnie)\s+/gi, '\n|\n')
      // A single hyphen separates only before the next country and postcode.
      .replace(new RegExp('-(?=' + countryNumeric + ')', 'gi'), '|')
      .replace(new RegExp('[ \t]+(?=' + countryNumeric + ')', 'gi'), '|');
    const out = [];
    for (const chunk of marked.split(/[|;]/)) {
      let pending = [];
      const hasPostal = line => /\d{4,6}|\d{2}-\d{3}|\d{3} \d{2}/.test(line);
      for (const line of chunk.split('\n').map(s => s.trim()).filter(Boolean)) {
        if (pending.length && hasPostal(pending.join(' ')) && hasPostal(line)) {
          out.push(pending.join(', ')); pending = [];
        }
        pending.push(line);
      }
      if (pending.length) out.push(pending.join(', '));
    }
    return out;
  }

  function parsePoint(raw, options) {
    let body = raw.replace(/^[\s,;:]+|[\s,;:]+$/g, '').replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
    if (!body) return null;
    const warnings = [];
    let country = null;
    let street = '';
    // A street before a COUNTRY POSTCODE CITY line remains part of the same stop.
    const embedded = body.match(new RegExp(',\\s*((?:' + codes.join('|') + ')[ ,\\d-].*)$', 'i'));
    if (embedded && !countryStart.test(body)) {
      street = body.slice(0, embedded.index).trim(); body = embedded[1];
    }
    const leading = body.match(countryStart);
    if (leading) { country = leading[1].toUpperCase(); body = body.slice(leading[0].length).trim(); }
    const trailing = body.match(countryEnd);
    if (trailing) {
      const endCountry = trailing[1].toUpperCase();
      if (country && country !== endCountry) throw new Error('Sprzeczne kraje w punkcie: ' + raw);
      country = endCountry; body = body.slice(0, trailing.index).trim();
    }
    if (country === 'UK') country = 'GB';
    body = body.replace(/^,+|,+$/g, '').trim();
    if (!body) throw new Error('Brak miejscowości lub kodu: ' + raw);
    // A space in a Polish 2+3 postal code is formatting, not a separate address part.
    if (country === 'PL') body = body.replace(/^(\d{2})[ \t]+(\d{3})(?=[ ,]|$)/, '$1-$2');
    let postalCode = null, postalPrefix = null;
    // Kody alfanumeryczne sprawdzamy przed samymi cyframi.
    const token = '(?:[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}|[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d|\\d{4}\\s?[A-Z]{2}|\\d{3} \\d{2}|\\d{2,6}(?:-\\d{2,4})?)';
    const front = body.match(new RegExp('^(' + token + ')(?:[ ,]+|$)', 'i'));
    const back = !front && body.match(new RegExp('(?:^|[ ,]+)(' + token + ')$', 'i'));
    const candidate = front || back;
    const match = candidate && /^\d{2,3}$/.test(candidate[1]) && (!country || back) ? null : candidate;
    if (match) {
      postalCode = match[1].toUpperCase();
      body = front ? body.slice(front[0].length).trim() : body.slice(0, back.index).trim();
      const knownFormat = country && formats[country];
      const nlArea = country === 'NL' && /^\d{4}$/.test(postalCode);
      const shortNumeric = /^\d{2,3}$/.test(postalCode);
      if (shortNumeric || (knownFormat && !knownFormat.test(postalCode) && !nlArea)) {
        postalPrefix = postalCode; postalCode = null;
        warnings.push('Niepełny lub niezgodny z formatem kod ' + postalPrefix + ': pominięty w zapytaniu Maps.');
        if (!body) throw new Error('Sam prefiks kodu nie wskazuje miejscowości: ' + raw);
      } else if (nlArea) {
        postalPrefix = postalCode;
        warnings.push('Holenderski kod obszaru ma 4 cyfry; brak dwóch liter pełnego kodu. Zachowano obszar, bez dopisywania liter.');
      } else if (!country || !knownFormat) {
        warnings.push('Format kodu nie został zweryfikowany dla kraju.');
      }
    }
    body = body.replace(/^,+|,+$/g, '').trim();
    body = options.cityAliases?.[body.toLocaleLowerCase('pl')] || body;
    // Optional explicit user mappings, e.g. { Psary: 'PL', Kesteren: 'NL' }.
    if (!country && options.cityCountries) {
      const entry = Object.entries(options.cityCountries).find(([city]) => city.toLocaleLowerCase('pl') === body.toLocaleLowerCase('pl'));
      if (entry) {
        country = String(entry[1]).toUpperCase();
        if (!codes.includes(country)) throw new Error('Nieznany kraj w cityCountries: ' + country);
        if (country === 'UK') country = 'GB';
      }
    }
    if (!country) warnings.push('Brak kraju: Google Maps sam rozstrzygnie lokalizację.');
    if (!body && !postalCode) throw new Error('Nie znaleziono lokalizacji: ' + raw);
    if (postalCode && country === 'PL' && /^\d{5}$/.test(postalCode)) postalCode = postalCode.slice(0, 2) + '-' + postalCode.slice(2);
    if (postalCode && ['CZ','SK','SE','GR'].includes(country) && /^\d{5}$/.test(postalCode)) postalCode = postalCode.slice(0, 3) + ' ' + postalCode.slice(3);
    if (postalCode && /^\d{4}\s?[A-Z]{2}$/.test(postalCode)) postalCode = postalCode.replace(/^(\d{4})\s?/, '$1 ');
    const query = [street, [postalCode, body].filter(Boolean).join(' '), country && countryName(country)].filter(Boolean).join(', ');
    return {raw: raw.trim(), country, street, localityOrAddress: body, postalCode, postalPrefix, query, warnings};
  }

  function parseRoute(text, options = {}) {
    const fields = readFields(text);
    let points;
    if (fields.structured) {
      points = fields.stops.flatMap(stop => {
        const cleaned = normalize(stop.parts.join('\n'));
        if (!cleaned) throw new Error('Puste pole adresowe: ' + stop.role);
        return split(cleaned).map((part, index) => {
          const point = parsePoint(part, options);
          if (!point) throw new Error('Nie znaleziono adresu w polu: ' + stop.role);
          if (index > 0) point.warnings.push('Dodatkowa lokalizacja bez osobnej etykiety: sprawdź kolejność.');
          return {...point, role: index === 0 ? stop.role : null};
        });
      });
    } else {
      const cleaned = normalize(fields.text);
      points = cleaned ? split(cleaned).map(s => parsePoint(s, options)).filter(Boolean) : [];
    }
    const warnings = [...fields.warnings, ...points.flatMap((p, i) => p.warnings.map(w => 'Punkt ' + (i + 1) + ': ' + w))];
    for (const note of String(text).match(/\([A-Z\d][A-Z\d .&-]{1,}\)/g) || []) warnings.push('Pominięto dopisek ' + note + '. Sprawdź, czy nie jest częścią lokalizacji.');
    if (fields.structured && points[0]?.role === 'unloading') warnings.push('Pierwszym punktem jest rozładunek. Zachowano kolejność źródłową; sprawdź kolejność trasy.');
    if (points.length === 1) warnings.push('Znaleziono tylko jeden punkt trasy.');
    return {points, warnings, ignoredFields: fields.ignoredFields, strategy: fields.structured ? 'labeled-fields' : 'route-text', needsReview: warnings.length > 0};
  }
  function addresses(text, options = {}) { return parseRoute(text, options).points.map(p => p.query); }
  function buildUrl(locations) {
    if (!Array.isArray(locations) || locations.length < 2 || locations.some(s => typeof s !== 'string' || !s.trim())) throw new Error('Potrzebne są przynajmniej dwa niepuste punkty.');
    if (locations.length > 11) throw new Error('Link Maps obsługuje maksymalnie 9 punktów pośrednich w przeglądarce desktopowej.');
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('origin', locations[0]);
    url.searchParams.set('destination', locations.at(-1));
    url.searchParams.set('travelmode', 'driving');
    if (locations.length > 2) url.searchParams.set('waypoints', locations.slice(1, -1).join('|'));
    if (url.href.length > 2048) throw new Error('Link Google Maps przekracza 2048 znaków.');
    return url.href;
  }
  function formatClipboardPoint(value) {
    let body = value.trim().replace(/\s+/g, ' ');
    let country = null;
    const aliases = [];
    for (const locale of ['en', 'pl', 'de']) {
      const display = new Intl.DisplayNames([locale], {type: 'region'});
      for (const code of codes) aliases.push([display.of(code === 'UK' ? 'GB' : code), code === 'UK' ? 'GB' : code]);
    }
    aliases.push(...codes.map(code => [code, code === 'UK' ? 'GB' : code]));
    aliases.sort((a, b) => b[0].length - a[0].length);
    for (const [name, code] of aliases) {
      const lower = body.toLocaleLowerCase();
      const suffix = ', ' + name.toLocaleLowerCase();
      if (lower.endsWith(suffix)) {
        country = code; body = body.slice(0, -suffix.length).trim(); break;
      }
      if (lower.startsWith(name.toLocaleLowerCase() + ' ') || lower.startsWith(name.toLocaleLowerCase() + ',')) {
        country = code; body = body.slice(name.length).replace(/^[, ]+/, ''); break;
      }
    }
    if (!country) return body;
    // Keep street/building details, but put the postal locality before them.
    const parts = body.split(/,\s*/);
    const postalPart = parts.findIndex(part => /^\d|^[A-Z]{1,2}\d/i.test(part));
    if (postalPart > 0 && formats[country]) {
      const tokens = parts[postalPart].split(/\s+/);
      if (formats[country].test(tokens[0]) || formats[country].test(tokens.slice(0, 2).join(' '))) {
        const locality = parts.splice(postalPart, 1)[0];
        body = [locality, ...parts].join(', ');
      }
    }
    if (country === 'PL') body = body.replace(/^(\d{2})[ -]?(\d{3})(?=[ ,]|$)/, '$1-$2');
    return country + ' ' + body;
  }
  function formatClipboardRoute(locations) {
    return locations.map(formatClipboardPoint).join('\n');
  }
  function enrichClipboardPoints(locations, rows) {
    let enriched = 0;
    const output = locations.map((point, index) => {
      const original = formatClipboardPoint(point);
      const row = rows.find(item => item.id === String(index));
      if (!row || row.status !== 'candidate' || !row.sources?.length || !codes.includes(row.country) || !formats[row.country]?.test(row.postcode)) return original;
      const countryMatch = original.match(/^([A-Z]{2}) /);
      const existingCountry = countryMatch && codes.includes(countryMatch[1]) ? countryMatch[1] : null;
      if (existingCountry && existingCountry !== row.country) return original;
      const body = existingCountry ? original.slice(3) : original;
      const tokens = body.split(/\s+/);
      // Do not replace supplied postcodes, prefixes, or numeric addresses.
      if (/^\d/.test(body) || formats[row.country].test(tokens[0]) || formats[row.country].test(tokens.slice(0, 2).join(' '))) return original;
      // Retain all original locality/street text; the model may only add missing data.
      enriched++;
      return formatClipboardPoint(row.country + ' ' + row.postcode + ' ' + body);
    });
    return {points: output, enriched};
  }
  return {parseRoute, addresses, buildUrl, formatClipboardRoute, enrichClipboardPoints};

})();

function parseAddresses(text, options = {}) { return TransportMaps.addresses(text, options); }
function parseTransportRoute(text, options = {}) { return TransportMaps.parseRoute(text, options); }
function buildGoogleMapsUrl(locations) { return TransportMaps.buildUrl(locations); }
if (typeof module !== 'undefined' && module.exports) module.exports = {parseAddresses, parseTransportRoute, buildGoogleMapsUrl, formatClipboardRoute: TransportMaps.formatClipboardRoute, enrichClipboardPoints: TransportMaps.enrichClipboardPoints};
