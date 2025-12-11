/**
 * Test Async Functionality
 *
 * This file tests all asynchronous (Promise-based) features
 */

import { TradingViewClient } from './dist/index.js';

console.log('=== TVTS Async Functionality Test ===\n');

async function testAsyncFunctions() {
  // Get auth token from environment or use unauthorized
  const authToken = process.env.TVWS_AUTH_TOKEN || 'unauthorized_user_token';
  console.log('Auth token:', authToken.substring(0, 20) + '...\n');

  // Create client
  const client = new TradingViewClient(authToken);
  console.log('Client created successfully\n');

  // Test 1: Download historical data for Indonesian stock
  console.log('Test 1: Download IDX:BBCA (15-minute, 20 bars)');
  console.log('---------------------------------------------------');
  try {
    const startTime = Date.now();
    const bbcaData = await client.download('IDX:BBCA', '15', 20, 30000);
    const duration = Date.now() - startTime;

    console.log('SUCCESS: Downloaded', bbcaData.length, 'bars in', duration, 'ms');

    if (bbcaData.length > 0) {
      const latest = bbcaData[bbcaData.length - 1];
      console.log('Latest bar:');
      console.log('  Timestamp:', latest.timestamp.toISOString());
      console.log('  Open:', latest.open);
      console.log('  High:', latest.high);
      console.log('  Low:', latest.low);
      console.log('  Close:', latest.close);
      console.log('  Volume:', latest.volume);

      // Verify data structure
      if (latest.timestamp instanceof Date &&
          typeof latest.open === 'number' &&
          typeof latest.high === 'number' &&
          typeof latest.low === 'number' &&
          typeof latest.close === 'number' &&
          typeof latest.volume === 'number') {
        console.log('VALIDATION: Data structure is correct');
      } else {
        console.log('ERROR: Data structure validation failed');
      }
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  console.log('');

  // Test 2: Download crypto data
  console.log('Test 2: Download COINBASE:BTCUSD (1-minute, 10 bars)');
  console.log('---------------------------------------------------');
  try {
    const startTime = Date.now();
    const btcData = await client.download('COINBASE:BTCUSD', '1', 10, 30000);
    const duration = Date.now() - startTime;

    console.log('SUCCESS: Downloaded', btcData.length, 'bars in', duration, 'ms');

    if (btcData.length > 0) {
      const latest = btcData[btcData.length - 1];
      console.log('Latest BTC bar:');
      console.log('  Timestamp:', latest.timestamp.toISOString());
      console.log('  Close: $' + latest.close.toFixed(2));
      console.log('  Volume:', latest.volume);
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  console.log('');

  // Test 3: Get current price
  console.log('Test 3: Get current price for COINBASE:BTCUSD');
  console.log('---------------------------------------------------');
  try {
    const startTime = Date.now();
    const price = await client.getPrice('COINBASE:BTCUSD', 30000);
    const duration = Date.now() - startTime;

    console.log('SUCCESS: Retrieved price in', duration, 'ms');
    console.log('Current BTC price: $' + price.toFixed(2));

    // Verify it's a valid number
    if (typeof price === 'number' && price > 0) {
      console.log('VALIDATION: Price is valid number');
    } else {
      console.log('ERROR: Price validation failed');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  console.log('');

  // Test 4: Get full quote
  console.log('Test 4: Get full quote for IDX:BBRI');
  console.log('---------------------------------------------------');
  try {
    const startTime = Date.now();
    const quote = await client.getQuote('IDX:BBRI', 30000);
    const duration = Date.now() - startTime;

    console.log('SUCCESS: Retrieved quote in', duration, 'ms');
    console.log('Quote data:');
    console.log('  Symbol:', quote.symbol);
    console.log('  Price:', quote.price);
    console.log('  Bid:', quote.bid || 'N/A');
    console.log('  Ask:', quote.ask || 'N/A');
    console.log('  Volume:', quote.volume || 'N/A');
    console.log('  Timestamp:', quote.timestamp.toISOString());

    // Verify quote structure
    if (quote.symbol && typeof quote.price === 'number' && quote.timestamp instanceof Date) {
      console.log('VALIDATION: Quote structure is correct');
    } else {
      console.log('ERROR: Quote structure validation failed');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  console.log('');

  // Test 5: Test with shorter timeout (should handle partial data)
  console.log('Test 5: Download with short timeout (10s)');
  console.log('---------------------------------------------------');
  try {
    const startTime = Date.now();
    const shortData = await client.download('IDX:TBLA', '15', 50, 10000);
    const duration = Date.now() - startTime;

    console.log('SUCCESS: Retrieved', shortData.length, 'bars in', duration, 'ms');
    console.log('Note: May return partial data due to short timeout');
  } catch (error) {
    console.log('ERROR:', error.message);
  }
  console.log('');

  // Test 6: Error handling - invalid symbol
  console.log('Test 6: Error handling - invalid symbol');
  console.log('---------------------------------------------------');
  try {
    await client.download('INVALID:SYMBOL', '15', 10, 10000);
    console.log('WARNING: Should have thrown error for invalid symbol');
  } catch (error) {
    console.log('SUCCESS: Error caught as expected');
    console.log('Error message:', error.message);
  }
  console.log('');

  console.log('=== All Async Tests Completed ===\n');
}

// Run tests
testAsyncFunctions().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
