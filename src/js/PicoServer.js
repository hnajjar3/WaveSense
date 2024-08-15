const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const config = require('config');

const app = express();
const port = config.get('server.port'); // Typically port 80

let picoWData = {}; // Variable to store data received from Pico W

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../../build'))); // Adjust the path to your build folder

// Middleware to parse JSON bodies
app.use(express.json());

// POST endpoint to change the channel (for future use if needed)
app.post('/set-channel', (req, res) => {
    const { channel } = req.body;
    console.log(`Channel changed to: ${channel}`);
    res.status(200).send(`Channel set to ${channel}`);
});

// All other routes should serve the React app's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html')); // Adjusted path
});

// Create an HTTP server
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// WebSocket server for forwarding data to React clients
const wss = new WebSocket.Server({ server });

// Handle WebSocket connection from React clients
wss.on('connection', (ws) => {
    console.log('WebSocket client (React) connected');

    // If we already have data from Pico W, start sending it to the client
    if (picoWData) {
        ws.send(JSON.stringify(picoWData));
    }

    ws.on('close', () => {
        console.log('WebSocket client (React) disconnected');
    });
});

// Connect to the Pico W as a WebSocket client (use Pico W's IP address)
const picoWIP = 'ws://192.168.4.47/ws'; // Pico W's IP and WebSocket route

const picoWClient = new WebSocket(picoWIP); // WebSocket client to Pico W

// When connection to Pico W is established
picoWClient.on('open', () => {
    console.log(`Connected to Pico W at ${picoWIP}`);
});

// When data is received from Pico W
picoWClient.on('message', (data) => {
    picoWData = JSON.parse(data); // Store the latest data from Pico W
    //console.log(`Data received from Pico W: ${data}`);

    // Forward the data to all connected React WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data); // Forward the data to React app
        }
    });
});

// Handle errors
picoWClient.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
});

// Handle close connection from Pico W
picoWClient.on('close', () => {
    console.log('WebSocket connection to Pico W closed');
});
