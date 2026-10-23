const {test} = require('node:test');
const assert = require('node:assert/strict');
const {formatClipboardRoute} = require('../src/core/transport-maps-parser.js');
test('plain lines, converts countries and retains full postcodes', () => {
 assert.equal(formatClipboardRoute(['57072 Siegen, Germany','39-100 Ropczyce, Poland']), 'DE 57072 Siegen\nPL 39-100 Ropczyce');
});
test('preserves intermediate and repeated places without symbols', () => {
 assert.equal(formatClipboardRoute(['Siegen, Germany','05-870 Błonie, Poland','Siegen, Germany','Ropczyce, Poland']), 'DE Siegen\nPL 05-870 Błonie\nDE Siegen\nPL Ropczyce');
});
test('does not invent absent countries, cities or postcodes; keeps street detail', () => {
 assert.equal(formatClipboardRoute(['Warszawa','02826, Germany','ul. Przemysłowa 12/4, 05-870 Błonie, Poland']), 'Warszawa\nDE 02826\nPL 05-870 Błonie, ul. Przemysłowa 12/4');
});
test('handles country codes, Polish names, leading zeroes and alphanumeric postcodes', () => {
 assert.equal(formatClipboardRoute(['PL 05 870 Błonie','1234 AB Test, Netherlands','57072 Siegen, Niemcy']), 'PL 05-870 Błonie\nNL 1234 AB Test\nDE 57072 Siegen');
});
const {enrichClipboardPoints} = require('../src/core/transport-maps-parser.js');
const candidate = (id, country, postcode) => ({id:String(id),status:'candidate',country,postcode,locality:'Model locality',sources:[{url:'https://example.com'}]});
test('adds codes without rewriting names, street details, order or duplicates',()=>{
 const result=enrichClipboardPoints(['Siegen Markt 2, Germany','Ropczyce, Poland','Siegen Markt 2, Germany'],[candidate(0,'DE','57072'),candidate(1,'PL','39-100'),candidate(2,'DE','57072')]);
 assert.deepEqual(result,{points:['DE 57072 Siegen Markt 2','PL 39-100 Ropczyce','DE 57072 Siegen Markt 2'],enriched:3});
});
test('preserves existing codes and rejects mismatched countries, uncertain or invalid codes',()=>{
 const original=['02826, Germany','Siegen, Germany','Ropczyce, Poland','Nowa Wieś'];
 const result=enrichClipboardPoints(original,[candidate(0,'DE','57072'),candidate(1,'PL','39-100'),candidate(2,'PL','39'),{...candidate(3,'PL','39-100'),status:'ambiguous'}]);
 assert.equal(result.enriched,0);assert.equal(formatClipboardRoute(result.points),'DE 02826\nDE Siegen\nPL Ropczyce\nNowa Wieś');
});
