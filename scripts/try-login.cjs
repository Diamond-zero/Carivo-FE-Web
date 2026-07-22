async function login(phone) {
  // Step 1: request challenge
  const challengeRes = await fetch(
    'https://wdp301-project-backend.onrender.com/api/v1/auth/phone/request-verification',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    },
  );
  const challenge = await challengeRes.json();
  console.log('Challenge:', JSON.stringify(challenge).slice(0, 200));
  return challenge;
}

async function loginPassword(phone, password) {
  const r = await fetch(
    'https://wdp301-project-backend.onrender.com/api/v1/auth/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    },
  );
  return await r.json();
}

async function tryLogin() {
  const candidates = [
    { phone: '+84900000000', password: 'Admin@123' },
    { phone: '+84900000001', password: 'Staff@123' },
    { phone: '+84987654321', password: 'Guest@123' },
  ];

  for (const c of candidates) {
    try {
      const res = await loginPassword(c.phone, c.password);
      console.log(`${c.phone}:`, res.success ? 'OK ' + res.data?.user?.role : JSON.stringify(res).slice(0, 200));
      if (res.success) {
        return { token: res.data.access_token, role: res.data.user.role, user: res.data.user };
      }
    } catch (e) {
      console.log(`${c.phone}: ERR ${e.message}`);
    }
  }
}

tryLogin().catch(e => console.error(e.message));
