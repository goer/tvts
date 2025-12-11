/**
 * Basic Usage Examples
 *
 * This file demonstrates basic usage patterns for the TVTS library.
 */

import { TradingViewClient } from 'tvts';

// Initialize client
const client = new TradingViewClient(process.env.TVWS_AUTH_TOKEN);

// ============================================================================
// ASYNC EXAMPLES (Promise-based)
// ============================================================================

async function asyncExamples() {
  console.log('=== Async Examples ===\n');

  // Example 1: Download historical data
  console.log('1. Downloading historical data...');
  const bbcaData = await client.download('IDX:BBCA', '15', 100);
  console.log(`   Received ${bbcaData.length} bars`);
  console.log('   Latest bar:', bbcaData[bbcaData.length - 1]);
  console.log('');

  // Example 2: Get current price
  console.log('2. Getting current price...');
  const btcPrice = await client.getPrice('COINBASE:BTCUSD');
  console.log(`   BTC/USD price: $${btcPrice}`);
  console.log('');

  // Example 3: Get full quote
  console.log('3. Getting full quote...');
  const quote = await client.getQuote('IDX:BBRI');
  console.log('   Quote:', quote);
  console.log('');

  // Example 4: Download with custom timeout
  console.log('4. Downloading with 60s timeout...');
  const longData = await client.download('IDX:TBLA', '60', 200, 60000);
  console.log(`   Received ${longData.length} bars`);
  console.log('');

  // Example 5: Error handling
  console.log('5. Error handling...');
  try {
    await client.download('INVALID:SYMBOL', '15', 100);
  } catch (error) {
    console.log('   Error caught:', error.message);
  }
  console.log('');
}

// ============================================================================
// SYNC EXAMPLES (Callback-based streaming)
// ============================================================================

function syncExamples() {
  console.log('=== Sync Examples ===\n');

  // Example 1: Stream real-time bars
  console.log('1. Streaming real-time bars for 30 seconds...');
  const barHandle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
    console.log(`   [${bar.timestamp.toLocaleTimeString()}] Close: $${bar.close}, Volume: ${bar.volume}`);
  });

  // Stop after 30 seconds
  setTimeout(() => {
    console.log('   Stopping bar stream...');
    barHandle.stop();
  }, 30000);

  // Example 2: Stream real-time quotes
  console.log('2. Streaming real-time quotes for 30 seconds...');
  const quoteHandle = client.streamQuote('IDX:BBCA', (quote) => {
    console.log(`   [${quote.timestamp.toLocaleTimeString()}] ${quote.symbol}: ${quote.price}`);
  });

  // Stop after 30 seconds
  setTimeout(() => {
    console.log('   Stopping quote stream...');
    quoteHandle.stop();
  }, 30000);

  // Example 3: Multiple streams
  console.log('3. Running multiple streams...');
  const btcHandle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
    console.log(`   BTC: $${bar.close}`);
  });

  const ethHandle = client.streamBars('COINBASE:ETHUSD', '1', (bar) => {
    console.log(`   ETH: $${bar.close}`);
  });

  // Check stream status
  setTimeout(() => {
    console.log(`   Active streams: ${client.getActiveStreamCount()}`);
    console.log(`   Stream IDs: ${client.getActiveStreamIds().join(', ')}`);
  }, 5000);

  // Disconnect all after 30 seconds
  setTimeout(() => {
    console.log('   Disconnecting all streams...');
    client.disconnect();
  }, 30000);
}

// ============================================================================
// COMBINED EXAMPLE
// ============================================================================

async function combinedExample() {
  console.log('=== Combined Example ===\n');

  // 1. First, download historical data (async)
  console.log('1. Downloading historical data...');
  const historicalData = await client.download('COINBASE:BTCUSD', '15', 50);
  console.log(`   Downloaded ${historicalData.length} historical bars`);

  const latestHistorical = historicalData[historicalData.length - 1];
  console.log(`   Latest historical close: $${latestHistorical.close}`);
  console.log('');

  // 2. Then, start streaming real-time updates (sync)
  console.log('2. Starting real-time stream...');
  const handle = client.streamBars('COINBASE:BTCUSD', '1', (bar) => {
    console.log(`   Real-time update: $${bar.close} at ${bar.timestamp.toLocaleTimeString()}`);
  });

  // 3. Get current price periodically (async)
  console.log('3. Checking price every 10 seconds...');
  const priceInterval = setInterval(async () => {
    const currentPrice = await client.getPrice('COINBASE:BTCUSD');
    console.log(`   Current price check: $${currentPrice}`);
  }, 10000);

  // 4. Cleanup after 60 seconds
  setTimeout(() => {
    console.log('4. Cleaning up...');
    handle.stop();
    clearInterval(priceInterval);
    console.log('   Done!');
  }, 60000);
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function main() {
  // Run async examples
  await asyncExamples();

  // Run sync examples
  syncExamples();

  // Wait a bit before running combined example
  setTimeout(() => {
    combinedExample();
  }, 35000);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { asyncExamples, syncExamples, combinedExample };
