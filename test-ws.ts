import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:7070');

ws.on('open', () => {
    console.log('Connected to WebSocket server');

    // Subscribe to quote
    console.log('Subscribing to quote: IDX:BBCA');
    ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'quote',
        symbol: 'IDX:BBCA'
    }));

    // Subscribe to bars
    console.log('Subscribing to bars: COINBASE:BTCUSD');
    ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'bars',
        symbol: 'COINBASE:BTCUSD',
        interval: '1'
    }));

    // Close after 10 seconds
    setTimeout(() => {
        console.log('Closing connection...');
        ws.close();
    }, 10000);
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received:', message);
});

ws.on('close', () => {
    console.log('Disconnected');
});

ws.on('error', (err) => {
    console.error('WebSocket error:', err);
});
