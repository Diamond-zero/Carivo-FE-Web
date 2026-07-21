async function main() {
  const r = await fetch('https://wdp301-project-backend.onrender.com/api/v1/garages?limit=20', {
    headers: { accept: 'application/json' },
  });
  const d = await r.json();
  console.log('Total:', d.data?.length);
  for (const g of d.data || []) {
    console.log(`  ${g.id}  ${g.garage_code}  ${g.name}  ${g.opening_time}-${g.closing_time}  slot=${g.slot_interval_minutes}min  grace=${g.late_grace_minutes}min  active=${g.is_active}`);
  }
}
main().catch(e => console.error(e.message));
