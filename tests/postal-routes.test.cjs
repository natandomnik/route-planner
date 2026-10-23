const {test} = require('node:test');
const assert = require('node:assert/strict');
const {parseTransportRoute, buildGoogleMapsUrl} = require('../transport-maps-parser.js');
for (const input of ['de 02826 do pl 05 870', 'DE02826 -> PL05870', 'DE 02826 → PL 05-870']) {
 test('country and postal codes: ' + input, () => {
  const result = parseTransportRoute(input);
  const points = result.points.map(p=>p.query);
  assert.deepEqual(points,['02826, Germany','05-870, Poland']);
  assert.equal(result.points[1].postalPrefix,null);
  const url = new URL(buildGoogleMapsUrl(points));
  assert.equal(url.searchParams.get('origin'),'02826, Germany');
  assert.equal(url.searchParams.get('destination'),'05-870, Poland');
 });
}
test('Polish space normalization keeps locality and building number',()=>{
 const result = parseTransportRoute('loading: PL 05 870 Błonie, ul. Przemysłowa 12\nunloading: DE 02826');
 assert.equal(result.points[0].postalCode,'05-870');
 assert.match(result.points[0].query,/Błonie, ul\. Przemysłowa 12/);
});
test('multiple points and repeated endpoints remain in source order',()=>{
 assert.deepEqual(parseTransportRoute('PL 05 870 > DE 02826 > PL 05-870').points.map(p=>p.query),['05-870, Poland','02826, Germany','05-870, Poland']);
});
