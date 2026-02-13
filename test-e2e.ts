// Using native fetch (Node 18+)
const BASE_URL = 'https://tvts.vercel.app';

async function testEndpoint(name: string, path: string) {
    try {
        const url = `${BASE_URL}${path}`;
        console.log(`Testing ${name} (${url})...`);
        const start = Date.now();
        const res = await fetch(url);
        const duration = Date.now() - start;

        if (!res.ok) {
            throw new Error(`Status ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log(`✅ ${name} passed in ${duration}ms`);
        // console.log(JSON.stringify(data, null, 2));

        return true;
    } catch (error: any) {
        console.error(`❌ ${name} failed:`, error.message);
        return false;
    }
}

async function runTests() {
    console.log('Starting E2E Tests for TVTS (Vercel)...\n');

    const results = await Promise.all([
        testEndpoint('Get Price (BTC)', '/api/price/COINBASE:BTCUSD'),
        testEndpoint('Get Quote (BBCA)', '/api/quote/IDX:BBCA'),
        testEndpoint('Get History (ETH)', '/api/history/COINBASE:ETHUSD?interval=1D&bars=5')
    ]);

    const passed = results.filter(r => r).length;
    console.log(`\nTests Completed: ${passed}/${results.length} passed`);

    if (passed !== results.length) {
        process.exit(1);
    }
}

runTests();
