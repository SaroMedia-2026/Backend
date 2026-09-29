/**
 * Automated Hardening & Concurrency Verification Test Script
 * Tests:
 * 1. Health & Uptime Monitoring
 * 2. Caching & Cache Invalidation (X-Cache: HIT / MISS)
 * 3. Simultaneous Concurrent Users (50 parallel requests)
 * 4. Duplicate Submission Protection
 * 5. Rate Limiting enforcement
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== SARO CMS HARDENING & CONCURRENCY TEST ===\n');

  // 1. Health & Uptime Monitoring Test
  console.log('1. Testing /health telemetry...');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const health: any = await res.json();
    console.log('   Status:', health.status);
    console.log('   Uptime:', health.uptime?.formatted, `(${health.uptime?.seconds}s)`);
    console.log('   Memory (MB):', JSON.stringify(health.system?.memoryMb));
    if (health.status === 'healthy') {
      console.log('   [PASS] Health & Uptime telemetry functional.\n');
    } else {
      console.log('   [FAIL] Unexpected health status.\n');
    }
  } catch (err: any) {
    console.error('   [FAIL] Could not reach /health:', err.message, '\n');
  }

  // 2. Caching Verification Test
  console.log('2. Testing Response Caching (X-Cache header)...');
  try {
    const res1 = await fetch(`${BASE_URL}/portfolio`);
    const cacheHeader1 = res1.headers.get('x-cache');

    const res2 = await fetch(`${BASE_URL}/portfolio`);
    const cacheHeader2 = res2.headers.get('x-cache');

    console.log('   Request 1 X-Cache:', cacheHeader1);
    console.log('   Request 2 X-Cache:', cacheHeader2);

    if (cacheHeader2 === 'HIT') {
      console.log('   [PASS] Response caching active and serving cached data.\n');
    } else {
      console.log('   [NOTE] Cache header on second request was:', cacheHeader2, '\n');
    }
  } catch (err: any) {
    console.error('   [FAIL] Caching test error:', err.message, '\n');
  }

  // 3. Simultaneous Concurrent Users Test (50 parallel requests)
  console.log('3. Simulating 50 Simultaneous Concurrent Users...');
  const start = Date.now();
  try {
    const requests = Array.from({ length: 50 }, (_, i) =>
      fetch(`${BASE_URL}/site-settings`).then((r) => r.status)
    );
    const results = await Promise.all(requests);
    const elapsed = Date.now() - start;
    const okCount = results.filter((s) => s === 200).length;

    console.log(`   Completed 50 requests in ${elapsed}ms (${(elapsed / 50).toFixed(2)}ms avg/req)`);
    console.log(`   200 OK responses: ${okCount}/50`);
    if (okCount === 50) {
      console.log('   [PASS] Handled simultaneous users seamlessly under load.\n');
    } else {
      console.log(`   [NOTE] Some requests returned non-200 status.\n`);
    }
  } catch (err: any) {
    console.error('   [FAIL] Concurrency test error:', err.message, '\n');
  }

  // 4. Duplicate Submission Prevention Test
  console.log('4. Testing Duplicate Submission Prevention...');
  const testPayload = {
    name: 'Duplicate Test Bot',
    email: 'bot@duplicate-test.com',
    message: 'Testing anti-duplicate submission window',
  };

  try {
    const sub1 = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const sub1Json = await sub1.json();

    const sub2 = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const sub2Json: any = await sub2.json();

    console.log('   First submission status:', sub1.status);
    console.log('   Immediate duplicate submission status:', sub2.status);
    console.log('   Duplicate response message:', sub2Json.message);

    if (sub2.status === 400 && sub2Json.message?.includes('Duplicate')) {
      console.log('   [PASS] Duplicate submission correctly blocked!\n');
    } else {
      console.log('   [NOTE] Duplicate submission outcome:', sub2.status, sub2Json, '\n');
    }
  } catch (err: any) {
    console.error('   [FAIL] Duplicate submission test error:', err.message, '\n');
  }

  // 5. Auth Rate Limiting Test (Strict Limit: 5 attempts per 15 min)
  console.log('5. Testing Auth Rate Limiting (5 max attempts)...');
  try {
    let rateLimited = false;
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fake@saromedia.com.np', password: 'wrongpassword' }),
      });
      if (res.status === 429) {
        rateLimited = true;
        const json: any = await res.json();
        console.log(`   Attempt ${i} blocked with HTTP 429:`, json.message);
        break;
      }
    }
    if (rateLimited) {
      console.log('   [PASS] Brute-force rate limiter activated with 429.\n');
    } else {
      console.log('   [NOTE] Rate limit not reached in 6 attempts.\n');
    }
  } catch (err: any) {
    console.error('   [FAIL] Auth rate limiter test error:', err.message, '\n');
  }

  console.log('=== HARDENING VERIFICATION COMPLETE ===');
}

runTests().catch(console.error);
