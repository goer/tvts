/**
 * Test Sync Functionality
 *
 * This file tests all synchronous (callback-based) streaming features
 */

import { TradingViewClient } from './dist/index.js';

console.log('=== TVTS Sync Streaming Test ===\n');

async function testSyncStreaming() {
  // Get auth token from environment or use unauthorized
  const authToken = process.env.TVWS_AUTH_TOKEN || 'unauthorized_user_token';
  console.log('Auth token:', authToken.substring(0, 20) + '...\n');

  // Create client
  const client = new TradingViewClient(authToken);
  console.log('Client created successfully\n');

  // Test 1: Stream bars
  console.log('Test 1: Stream COINBASE:BTCUSD bars (1-minute) for 15 seconds');
  console.log('---------------------------------------------------');

  const barData = [];
  let barCount = 0;

  const barHandle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
    barCount++;
    barData.push(bar);

    console.log(`Bar ${barCount}:`, bar.timestamp.toLocaleTimeString(), '- Close: $' + bar.close.toFixed(2), 'Vol:', bar.volume);

    // Validate bar structure
    if (!(bar.timestamp instanceof Date) ||
        typeof bar.open !== 'number' ||
        typeof bar.high !== 'number' ||
        typeof bar.low !== 'number' ||
        typeof bar.close !== 'number' ||
        typeof bar.volume !== 'number') {
      console.log('ERROR: Invalid bar structure');
    }
  });

  console.log('Stream started, handle ID:', barHandle.id);
  console.log('Handle is active:', barHandle.isActive());

  // Wait 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Stop stream
  console.log('\nStopping bar stream...');
  barHandle.stop();
  console.log('Handle is active:', barHandle.isActive());
  console.log('Total bars received:', barCount);

  if (barCount > 0) {
    console.log('SUCCESS: Received', barCount, 'bars');
  } else {
    console.log('WARNING: No bars received');
  }
  console.log('');

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Stream quotes
  console.log('Test 2: Stream IDX:BBCA quotes for 15 seconds');
  console.log('---------------------------------------------------');

  const quoteData = [];
  let quoteCount = 0;

  const quoteHandle = client.streamQuote('IDX:BBCA', (quote) => {
    quoteCount++;
    quoteData.push(quote);

    console.log(`Quote ${quoteCount}:`, quote.timestamp.toLocaleTimeString(), '- Price:', quote.price, 'Symbol:', quote.symbol);

    // Validate quote structure
    if (!quote.symbol || typeof quote.price !== 'number' || !(quote.timestamp instanceof Date)) {
      console.log('ERROR: Invalid quote structure');
    }
  });

  console.log('Quote stream started, handle ID:', quoteHandle.id);

  // Wait 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));

  // Stop stream
  console.log('\nStopping quote stream...');
  quoteHandle.stop();
  console.log('Total quotes received:', quoteCount);

  if (quoteCount > 0) {
    console.log('SUCCESS: Received', quoteCount, 'quotes');
  } else {
    console.log('WARNING: No quotes received');
  }
  console.log('');

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Multiple concurrent streams
  console.log('Test 3: Multiple concurrent streams (BTC, ETH) for 10 seconds');
  console.log('---------------------------------------------------');

  let btcCount = 0;
  let ethCount = 0;

  const btcHandle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
    btcCount++;
    console.log('BTC:', bar.timestamp.toLocaleTimeString(), '- $' + bar.close.toFixed(2));
  });

  const ethHandle = client.streamBars('COINBASE:ETHUSD', '1', (bar) => {
    ethCount++;
    console.log('ETH:', bar.timestamp.toLocaleTimeString(), '- $' + bar.close.toFixed(2));
  });

  console.log('Active streams:', client.getActiveStreamCount());
  console.log('Stream IDs:', client.getActiveStreamIds());

  // Wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Stop both streams
  console.log('\nStopping both streams...');
  btcHandle.stop();
  ethHandle.stop();

  console.log('BTC bars received:', btcCount);
  console.log('ETH bars received:', ethCount);
  console.log('Active streams after stop:', client.getActiveStreamCount());

  if (btcCount > 0 && ethCount > 0) {
    console.log('SUCCESS: Both streams received data');
  } else {
    console.log('WARNING: Some streams did not receive data');
  }
  console.log('');

  // Test 4: Disconnect all streams
  console.log('Test 4: Test disconnect all functionality');
  console.log('---------------------------------------------------');

  const stream1 = client.streamQuote('COINBASE:BTCUSD', () => {});
  const stream2 = client.streamQuote('COINBASE:ETHUSD', () => {});
  const stream3 = client.streamQuote('IDX:BBCA', () => {});

  console.log('Started 3 streams');
  console.log('Active streams:', client.getActiveStreamCount());

  client.disconnect();

  console.log('After disconnect(), active streams:', client.getActiveStreamCount());

  if (client.getActiveStreamCount() === 0) {
    console.log('SUCCESS: All streams disconnected');
  } else {
    console.log('ERROR: Some streams still active');
  }
  console.log('');

  console.log('=== All Sync Tests Completed ===\n');
}

// Run tests
testSyncStreaming().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
