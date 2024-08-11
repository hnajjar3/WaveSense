const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const { generateFunction } = require('./signalGenerator'); // Adjust the path as needed

const app = express();
const port = 8080; // Single port for both HTTP and WebSocket
const samplingRate = 10;
const offset = 0;

let currentChannel = 0;

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../build'))); // Adjusted path

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint to change the channel
app.post('/set-channel', (req, res) => {
    const { channel } = req.body;
    if (channel >= 0 && channel <= 3) {
        currentChannel = channel;
        console.log(`Channel changed to: ${channel}`);
        res.status(200).send(`Channel set to ${channel}`);
    } else {
        res.status(400).send('Invalid channel');
    }
});

// All other routes should serve the React app's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html')); // Adjusted path
});

// Create an HTTP server
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    let n = 0;

    const sendSignal = () => {
        const signal = generateFunction(n, currentChannel, offset, samplingRate);
        ws.send(JSON.stringify({ n, signal }));
        n++;
    };

    const interval = setInterval(sendSignal, 1000 / samplingRate);

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clearInterval(interval);
    });
});