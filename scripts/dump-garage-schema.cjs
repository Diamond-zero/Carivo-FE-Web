const fs = require('fs');
(async () => {
  const r = await fetch('https://wdp301-project-backend.onrender.com/api-docs/swagger-ui-init.js');
  const t = await r.text();
  const idx = t.indexOf('"swaggerDoc":');
  const src = t.slice(idx);
  const startObj = src.indexOf('{', src.indexOf('swaggerDoc'));
  let depth = 0, endObj = -1;
  for (let i = startObj; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { endObj = i; break; } }
  }
  const specSrc = src.slice(startObj, endObj + 1);
  const spec = JSON.parse(specSrc);

  // Print GaragePublic + AvailableBookingSlot + AllGarage responses
  for (const name of ['GaragePublic', 'GarageListResponse']) {
    console.log('\n==', name, '==');
    const s = spec.components.schemas[name];
    if (!s) { console.log('NOT FOUND'); continue; }
    console.log(JSON.stringify(s, null, 2).slice(0, 5000));
  }
})();
