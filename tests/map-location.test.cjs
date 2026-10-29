const {test}=require('node:test');const assert=require('node:assert/strict');
const {expected,matches}=require('../src/modules/suggestion-map/location-validation.js');
const wanted=expected({text:'DE 34414 Warburg',item:{country:'DE',postcode:'34414',city:'Warburg'}});
const row={lat:51.49,lon:9.15,country_code:'de',postcode:'34414',city:'Warburg',rank:{confidence:1}};
test('map rejects wrong country, postcode, locality and invalid coordinates even with high confidence',()=>{
 assert.equal(matches(row,wanted),true);
 for(const patch of [{country_code:'fr'},{postcode:'34415'},{city:'Paris'},{lat:NaN},{lat:100},{rank:{confidence:.6}}]) assert.equal(matches({...row,...patch},wanted),false);
});
test('normalized endpoint retains country and postal constraint',()=>{
 assert.deepEqual(expected({text:'34414 Warburg, Germany'}),{country:'de',postcode:'34414',city:'Warburg'});
 assert.equal(matches({...row,city:'Długołęka',country_code:'pl',postcode:'55-095'},{country:'pl',postcode:'55 095',city:'Dlugoleka'}),true);
});
test('structured geocoding separates country, complete postcode and city',()=>{
 const {parameters}=require('../src/modules/suggestion-map/location-validation.js');
 for(const [text,country,postcode,city] of [
  ['pl 55 095 Długołęka','pl','55-095','Długołęka'],
  ['DE 02826','de','02826',''],
  ['Warburg 34414, Germany','de','34414','Warburg'],
  ['BE 4000 Liège','be','4000','Liège'],
  ['CZ 70800 Ostrava','cz','708 00','Ostrava'],
  ['NL 5928 PN Venlo','nl','5928 PN','Venlo'],
  ['DE 57 Siegen','de','','Siegen']
 ]) {
  const record={text},wanted=expected(record);
  assert.deepEqual(wanted,{country,postcode,city});
  const params=parameters(record,wanted);
  assert.equal(params.has('text'),false);
  assert.equal(params.get('city'),city||null);
  assert.equal(params.get('postcode'),postcode||null);
  assert.equal(params.get('filter'),'countrycode:'+country);
  assert.equal(params.get('bias'),'countrycode:none');
  const fallback=parameters(record,wanted,true);
  assert.equal(fallback.get('text'),text);
  assert.equal(fallback.has('city'),false);
  assert.equal(fallback.has('country'),false);
 }
});
test('known localized city names match only within the validated country',()=>{
 const wanted=expected({text:'CZ Ostrava'});
 const row={lat:49.82,lon:18.26,country_code:'cz',city:'Ostrawa',rank:{confidence:1}};
 assert.equal(matches(row,wanted),true);
 assert.equal(matches({...row,country_code:'pl'},wanted),false);
});
test('street addresses remain free-form rather than becoming structured city names',()=>{
 const {parameters}=require('../src/modules/suggestion-map/location-validation.js');
 const record={text:'Unter den Linden 1, Berlin, Germany'};
 const wanted=expected(record),params=parameters(record,wanted);
 assert.equal(wanted.city,'Berlin');
 assert.equal(params.get('text'),record.text);
 assert.equal(params.has('city'),false);
 assert.equal(params.get('filter'),'countrycode:de');
});
