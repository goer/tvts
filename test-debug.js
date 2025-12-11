/**
 * Debug Test - See Raw Messages
 */

import { TradingViewClient } from './dist/index.js';
import { WebSocketClient } from './dist/core/WebSocketClient.js';
import { SessionManager } from './dist/core/SessionManager.js';
import { MessageProcessor } from './dist/core/MessageProcessor.js';
import { DataParser } from './dist/core/DataParser.js';

console.log('=== Debug Test - Raw Messages ===\n');

async function debugTest() {
  const authToken = process.env.TVWS_AUTH_TOKEN || 'unauthorized_user_token';

  // Create components
  const ws = new WebSocketClient(authToken);
  const sessionManager = new SessionManager();
  const messageProcessor = new MessageProcessor();
  const dataParser = new DataParser();

  let messageCount = 0;

  // Log all raw messages
  ws.onMessage((rawMessage) => {
    messageCount++;
    console.log(`\n--- Message ${messageCount} ---`);
    console.log('Raw:', rawMessage.substring(0, 200));

    const messages = messageProcessor.decodeMessage(rawMessage);
    console.log('Decoded messages:', messages.length);

    for (const msg of messages) {
      console.log('Type:', msg.m || 'unknown');
      console.log('Message:', JSON.stringify(msg).substring(0, 300));

      // Try to parse
      if (dataParser.isBarDataMessage(msg)) {
        console.log('This is BAR DATA!');
        const bars = dataParser.parseBarData(msg);
        console.log('Parsed bars:', bars.length);
      }

      if (dataParser.isQuoteDataMessage(msg)) {
        console.log('This is QUOTE DATA!');
        const quote = dataParser.parseQuoteData(msg);
        console.log('Parsed quote:', quote);
      }
    }
  });

  // Connect
  await ws.connect();
  console.log('Connected!\n');

  // Create chart session
  const chartSession = sessionManager.generateChartSession();
  console.log('Chart session:', chartSession);

  ws.send(messageProcessor.createChartSession(chartSession));
  console.log('Sent: chart_create_session\n');

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Resolve symbol
  ws.send(messageProcessor.createResolveSymbol(chartSession, 'symbol_1', 'COINBASE:BTCUSD'));
  console.log('Sent: resolve_symbol for COINBASE:BTCUSD\n');

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create series
  ws.send(messageProcessor.createSeries(chartSession, 's1', 's1', 'symbol_1', '1', 10));
  console.log('Sent: create_series for 10 bars\n');

  // Wait to see messages
  console.log('Waiting for messages for 20 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 20000));

  ws.disconnect();
  console.log('\n=== Debug Test Completed ===');
  console.log('Total messages received:', messageCount);
}

debugTest().catch(console.error);
