const express = require('express');
const WebSocket = require('ws');
const { generateFunction } = require('./signalGenerator'); 

const app = express();
const httpPort = 8080; // HTTP port
const wsPort = 8081; // WebSocket port
const samplingRate = 10; // Adjust this based on your needs
const offset = 0; // Offset value, can be adjusted or set dynamically

let currentChannel = 0; // Default channel

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint to change the channel
app.post('/set-channel', (req, res) => {
    const { channel } = req.body;
    if (channel >= 0 && channel <= 3) {
        currentChannel = channel;
        res.status(200).send(`Channel set to ${channel}`);
    } else {
        res.status(400).send('Invalid channel');
    }
});

// Start HTTP server 
app.listen(httpPort, () => {
    console.log(`HTTP server running on http://localhost:${httpPort}`);
});


// Set up websocket connection for data transmission
const wss = new WebSocket.Server({ port: wsPort });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    let n = 0;

    const sendSignal = () => {
        const signal = generateFunction(n, currentChannel, offset, samplingRate);
        ws.send(JSON.stringify({ n, signal }));
        n++;
    };

    // Stream data at the given sampling rate
    const interval = setInterval(sendSignal, 1000 / samplingRate);

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clearInterval(interval);
    });
});

console.log(`WebSocket server started on ws://localhost:${wsPort}`);