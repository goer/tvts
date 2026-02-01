#!/usr/bin/env node

import { Command } from 'commander';
import { TradingViewClient } from './client/TradingViewClient.js';
import { Interval } from './models/types.js';

const program = new Command();

program
    .name('tvts')
    .description('TradingView TypeScript Library CLI')
    .version('1.0.0')
    .option('-t, --token <token>', 'TradingView Auth Token');

// Helper to get client
const getClient = (options: any) => {
    return new TradingViewClient(options.token || process.env.TVWS_AUTH_TOKEN);
};

// Quote Command
program
    .command('quote')
    .description('Get quote for a symbol')
    .argument('<symbol>', 'Trading symbol (e.g. IDX:BBCA)')
    .action(async (symbol) => {
        const client = getClient(program.opts());
        try {
            const quote = await client.getQuote(symbol);
            console.log(JSON.stringify(quote, null, 2));
        } catch (error: any) {
            console.error('Error fetching quote:', error.message);
            process.exit(1);
        }
        client.disconnect();
    });

// Price Command
program
    .command('price')
    .description('Get current price for a symbol')
    .argument('<symbol>', 'Trading symbol')
    .action(async (symbol) => {
        const client = getClient(program.opts());
        try {
            const price = await client.getPrice(symbol);
            console.log(price);
        } catch (error: any) {
            console.error('Error fetching price:', error.message);
            process.exit(1);
        }
        client.disconnect();
    });

// History Command
program
    .command('history')
    .description('Get historical OHLCV data')
    .argument('<symbol>', 'Trading symbol')
    .option('-i, --interval <interval>', 'Timeframe interval', '1D')
    .option('-b, --bars <number>', 'Number of bars', '100')
    .action(async (symbol, options) => {
        const client = getClient(program.opts());
        try {
            const interval = options.interval as Interval;
            const bars = parseInt(options.bars, 10);
            const data = await client.download(symbol, interval, bars);
            console.log(JSON.stringify(data, null, 2));
        } catch (error: any) {
            console.error('Error downloading history:', error.message);
            process.exit(1);
        }
        client.disconnect();
    });

// Stream Command
const stream = program.command('stream').description('Stream real-time data');

stream
    .command('bars')
    .description('Stream real-time bars')
    .argument('<symbol>', 'Trading symbol')
    .option('-i, --interval <interval>', 'Timeframe interval', '1')
    .action((symbol, options) => {
        const client = getClient(program.opts());
        console.log(`Streaming bars for ${symbol}... (Press Ctrl+C to stop)`);

        client.streamBars(symbol, options.interval as Interval, (bar) => {
            console.log(JSON.stringify(bar));
        });

        // Keep process alive
        process.on('SIGINT', () => {
            client.disconnect();
            process.exit(0);
        });
    });

stream
    .command('quote')
    .description('Stream real-time quotes')
    .argument('<symbol>', 'Trading symbol')
    .action((symbol) => {
        const client = getClient(program.opts());
        console.log(`Streaming quotes for ${symbol}... (Press Ctrl+C to stop)`);

        client.streamQuote(symbol, (quote) => {
            console.log(JSON.stringify(quote));
        });

        // Keep process alive
        process.on('SIGINT', () => {
            client.disconnect();
            process.exit(0);
        });
    });

program.parse();
