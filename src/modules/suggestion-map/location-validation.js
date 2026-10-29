'use strict';
const MapLocationValidation = (() => {
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/gi,'l').toLowerCase().replace(/[^a-z0-9]/g,'');
  const codes='PL DE CZ SK AT BE NL FR ES PT IT CH GB IE DK SE NO FI HU RO BG SI HR LT LV EE LU UA RS BA ME MK AL GR TR IS'.split(' ');
  const countries=codes.flatMap(code=>[code,...['en','pl','de','fr'].map(locale=>new Intl.DisplayNames([locale],{type:'region'}).of(code))].map(name=>({code:code.toLowerCase(),name:name.toLowerCase()}))).sort((a,b)=>b.name.length-a.name.length);
  function postalPattern(country) {
    return {pl:'\\d{2}[- ]?\\d{3}',cz:'\\d{3} ?\\d{2}',sk:'\\d{3} ?\\d{2}',se:'\\d{3} ?\\d{2}',nl:'\\d{4} ?[A-Z]{2}',gb:'[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}',pt:'\\d{4}-\\d{3}',de:'\\d{5}',fr:'\\d{5}',es:'\\d{5}',it:'\\d{5}'}[country] || '\\d{2}-\\d{3}|\\d{3} \\d{2}|\\d{4} ?[A-Z]{2}|\\d{4,6}';
  }
  function normalizePostcode(value,country) {
    const compact=String(value||'').replace(/\s|-/g,'').toUpperCase();
    if(country==='pl'&&/^\d{5}$/.test(compact)) return compact.slice(0,2)+'-'+compact.slice(2);
    if(['cz','sk','se'].includes(country)&&/^\d{5}$/.test(compact)) return compact.slice(0,3)+' '+compact.slice(3);
    return String(value||'').trim().toUpperCase();
  }
  function expected(record) {
    if (record.item?.country && record.item?.city) {
      const country=record.item.country.toLowerCase();
      return {country,postcode:normalizePostcode(record.item.postcode,country),city:record.item.city.trim()};
    }
    let text=String(record.text||'').trim().replace(/\s+/g,' '),country='';
    for(const entry of countries) {
      const lower=text.toLowerCase(),name=entry.name;
      if(lower===name) {country=entry.code;text='';break;}
      if(lower.startsWith(name+' ')||lower.startsWith(name+',')) {country=entry.code;text=text.slice(name.length).replace(/^[, ]+/,'');break;}
      if(lower.endsWith(', '+name)||lower.endsWith(' '+name)) {country=entry.code;text=text.slice(0,-name.length).replace(/[, ]+$/,'');break;}
    }
    const pattern=postalPattern(country);
    const leading=text.match(new RegExp('^('+pattern+')(?:[ ,]+|$)','i'));
    const trailing=!leading&&text.match(new RegExp('(?:^|[ ,]+)('+pattern+')$','i'));
    const postal=leading||trailing;
    if(leading) text=text.slice(leading[0].length).trim();
    else if(trailing) text=text.slice(0,trailing.index).trim();
    // Freight shorthand such as DE 57 Siegen is a region prefix, not a full postcode.
    if(!postal&&['de','pl'].includes(country)) text=text.replace(/^\d{2}\s+(?=\p{L})/u,'');
    // Keep full street addresses in free-form mode; never send a street as a city.
    if(/\d/.test(text)||text.includes(',')) {
      const city=text.split(',').at(-1).trim();
      return {country,postcode:normalizePostcode(postal?.[1],country),city:/\d/.test(city)?'':city,freeform:true};
    }
    return {country,postcode:normalizePostcode(postal?.[1],country),city:text};
  }
  function parameters(record,wanted,freeform=false) {
    const params=new URLSearchParams({format:'json',limit:'5',lang:'pl',bias:'countrycode:none'});
    if(wanted.country) params.set('filter','countrycode:'+wanted.country);
    if(freeform||wanted.freeform||(!wanted.city&&!wanted.postcode)) params.set('text',record.text);
    else {
      if(wanted.country) params.set('country',new Intl.DisplayNames(['en'],{type:'region'}).of(wanted.country.toUpperCase()));
      if(wanted.postcode) params.set('postcode',wanted.postcode);
      if(wanted.city) params.set('city',wanted.city);
      params.set('type',wanted.postcode?'locality':'city');
    }
    return params;
  }
  function matches(row, wanted) {
    if(!row || !Number.isFinite(row.lat)||!Number.isFinite(row.lon)||Math.abs(row.lat)>90||Math.abs(row.lon)>180) return false;
    if(!Number.isFinite(row.rank?.confidence)||row.rank.confidence<.8) return false;
    if(wanted.country && row.country_code?.toLowerCase()!==wanted.country) return false;
    if(wanted.postcode && fold(row.postcode)!==fold(wanted.postcode)) return false;
    const aliases={cz:{ostrawa:'ostrava',praga:'praha'},de:{monachium:'munchen',kolonia:'koln',norymberga:'nurnberg'},pl:{warsaw:'warszawa',wroclaw:'wroclaw',breslau:'wroclaw'}};
    const normalizeCity=value=>aliases[row.country_code?.toLowerCase()]?.[fold(value)]||fold(value);
    return !wanted.city || [row.city,row.town,row.village,row.municipality,row.name].some(value=>value && normalizeCity(value)===normalizeCity(wanted.city));
  }
  return {expected,matches,parameters};
})();
if(typeof module!=='undefined') module.exports=MapLocationValidation;
