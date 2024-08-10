const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const config = require('config');
const { generateFunction } = require('./signalGenerator');

// Access configuration values
const port = config.get('server.port');
let samplingRate = config.get('server.samplingRate');
let channel = 0; // Default to channel 0 (sine wave)
let offset = 0; // Default offset

console.log(`Server will run on port ${port} with a default sampling rate of ${samplingRate} Hz`);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const sendData = () => {
        let x = 0;
        const intervalId = setInterval(() => {
            const data = {
                name: `Point ${x}`,
                deltaT: x / samplingRate,
                value: generateFunction(x, channel, offset) // Pass the offset to the function
            };
            ws.send(JSON.stringify(data));
            x += 1;
        }, 1000 / samplingRate);

        ws.on('close', () => {
            clearInterval(intervalId);
            console.log('Client disconnected');
        });
    };

    sendData();

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.samplingRate) {
            samplingRate = parsedMessage.samplingRate;
            console.log(`Sampling rate updated to ${samplingRate} Hz`);
        }
        if (parsedMessage.channel !== undefined) {
            channel = parsedMessage.channel;
            console.log(`Channel updated to ${channel}`);
                    }
        if (parsedMessage.offset !== undefined) {
            offset = parsedMessage.offset;
            console.log(`Offset updated to ${offset}`);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});