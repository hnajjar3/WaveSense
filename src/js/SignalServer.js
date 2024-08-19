const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const config = require('config');
const { GenerateFunction } = require('./FunctionGenerator');

const app = express();
const port = config.get('server.port');
let frequency = config.get('frequency') || 1000;  // Default to 1000 Hz if undefined
let samplingRate = config.get('samplingRate');             // Use let to update it
let noise = config.get('noise');                           // Use let to update it
let bias = config.get('bias');                             // Use let to update it

let currentChannel = 0; // Default channel
let wsClients = [];
let n = 0; // Global counter for signal generation
let broadcastInterval = null; // Store the interval ID

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint to change the channel
app.post('/set-channel', (req, res) => {
    const { channel } = req.body;
    if (channel >= 0 && channel <= 3) {
        currentChannel = channel; // Update channel
        console.log(`Channel changed to: ${channel}`);
        res.status(200).send({ status: 'success', channel });
    } else {
        res.status(400).send('Invalid channel');
    }
});

// POST endpoint to update function generator settings
app.post('/update-func-gen', (req, res) => {
    const { frequency: newFrequency, samplingRate: newSamplingRate, noise: newNoise, bias: newBias } = req.body;

    // Update the global variables
    frequency = newFrequency;
    samplingRate = newSamplingRate;
    noise = newNoise;
    bias = newBias;

    console.log(`Updated Func Gen Settings: frequency=${frequency}, SamplingRate=${samplingRate}, Noise=${noise}, Bias=${bias}`);
    res.status(200).send({ status: 'success' });
});

// Create an HTTP server
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

// Broadcast the signal to all WebSocket clients
const broadcastSignal = () => {
    const signal = GenerateFunction(n, currentChannel, bias, noise, frequency, samplingRate);
    const message = JSON.stringify({ n, signal });

    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });

    n++; // Increment signal counter
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsClients.push(ws);

    // If this is the first client, start broadcasting
    if (wsClients.length === 1 && !broadcastInterval) {
        broadcastInterval = setInterval(broadcastSignal, 1000 / samplingRate);
    }

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        wsClients = wsClients.filter(client => client !== ws);

        // If no clients remain, stop broadcasting
        if (wsClients.length === 0) {
            clearInterval(broadcastInterval);
            broadcastInterval = null;
        }
    });
});
