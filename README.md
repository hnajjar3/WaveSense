# WaveSense React JS

WaveSense React JS is a real-time signal plotting and analysis application built with React and Chart.js. It allows users to visualize and interact with data streams in real-time, estimate PSD using Welch’s method, and classify signals using a random forest model.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [WebSocket Server](#websocket-server)
- [Microcontroller (Pico) Setup](#microcontroller-pico-setup)
- [PSD Estimation](#psd-estimation)
- [Random Forest Model](#random-forest-model)
- [Web Workers](#web-workers)
- [Available Scripts](#available-scripts)
- [App Structure](#app-structure)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-Time Plotting:** Visualize live data streams with customizable data points.
- **Dark Mode:** Toggle between light and dark themes.
- **Data Recording:** Record incoming data with a web worker and save it as a JSON file.
- **Dynamic Axis Scaling:** Adjust y-axis range and x-axis points dynamically.
- **Channel Selection:** Choose between data channels.
- **Screen Lock:** Freeze the chart to pause live updates.
- **Screenshot** Saves a snapshot as PNG image.
- **Formulae Conversion** Convert signal value using symbolic formulae.
- **PSD Estimation:** Calculate the Power Spectral Density (PSD) using Welch’s method.
- **Signal Classification:** Classify signal types using a random forest model.

## Demo

![WaveSense React JS Screenshot](screenshot.png)


## Video Demo

Check out the video demo of WaveSense here:

[![Watch the video](https://img.youtube.com/vi/jhqp8_OhZGY/maxresdefault.jpg)](https://youtu.be/jhqp8_OhZGY)


## Installation

To set up WaveSense React JS:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/wavesense-react.git
   cd wavesense-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Python libraries for PSD estimation:**
   ```bash
   pip install flask numpy matplotlib scipy
   ```

4. **Set up the WebSocket server:** Ensure you have a WebSocket server running (instructions below).

5. **Run the development server:**
   ```bash
   npm start
   ```

## Usage

Once the application is running, you can interact with the various controls available in the sidebar:

- **Dark Mode Toggle:** Switch between light and dark themes.
- **Record Data:** Start and stop recording incoming data using a web worker.
- **Offset, Y-Axis, X-Axis Points:** Customize chart parameters.
- **Screenshot** Saves a snapshot as PNG image.
- **Formulae Conversion** Convert signal value using symbolic formulae.
- **Channel Selection:** Switch between channels (ch0, ch1, ch2, ch3).
- **PSD Estimation:** Available on `/psd` for Welch's method.

## WebSocket Server

The app requires a WebSocket server that streams data in the following format:

```json
{
  "n": 0,
  "signal": 0.5877852522924731
}
```

### Example Node.js WebSocket Server

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  let n = 0;
  setInterval(() => {
    const signal = Math.sin(n / 10);
    ws.send(JSON.stringify({ n, signal }));
    n++;
  }, 100);
});

console.log('WebSocket server running on ws://localhost:8080');
```

## Microcontroller (Pico) Setup

### Pico Code

1. **Connect your Raspberry Pi Pico (RP2040) to Wi-Fi:**

`boot.py`:

```python
import network
import time

SSID = 'your-SSID'
PASSWORD = 'your-password'

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)

    while wlan.status() != 3:
        print('Connecting to Wi-Fi...')
        time.sleep(1)

    print('Connected, IP:', wlan.ifconfig()[0])

connect_wifi()
```

2. **Main Pico code for WebSocket communication and OLED voltage display:**

`main.py`:

```python
from microdot import Microdot
from microdot.websocket import with_websocket
import uasyncio as asyncio
from machine import ADC, Pin, I2C
import ssd1306
import json

app = Microdot()
adc = ADC(Pin(26))
oled = ssd1306.SSD1306_I2C(128, 32, I2C(0, scl=Pin(5), sda=Pin(4)))

async def read_adc(n):
    raw_value = adc.read_u16() >> 4
    voltage = raw_value * 3.3 / 4095 * 5.06
    return n, voltage

@app.route('/ws')
@with_websocket
async def websocket(request, ws):
    n = 0
    while True:
        n, voltage = await read_adc(n)
        await ws.send(json.dumps({'n': n, 'signal': voltage}))
        await asyncio.sleep(0.01)

asyncio.run(app.start_server(port=80))
```

This code reads voltage data, updates an OLED screen, and streams the data via WebSocket.

## PSD Estimation

The `/psd` sublink provides a Power Spectral Density (PSD) estimation using Welch’s method. Data is stored in the `data/psd` directory.

### Running the Flask app for PSD estimation:

```bash
python src/py/estimate_psd.py
```

This app listens for data and serves the PSD plot on `http://localhost:8080/psd`.

### Example Flask App (PSD estimation):

```python
from flask import Flask, render_template
import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import welch

app = Flask(__name__)

@app.route('/psd')
def plot_psd():
    data = np.loadtxt('data/psd/signal.csv', delimiter=',')
    freqs, psd = welch(data[:, 1], fs=1000, nperseg=256)
    plt.figure()
    plt.semilogy(freqs, psd)
    plt.title('Power Spectral Density')
    plt.xlabel('Frequency (Hz)')
    plt.ylabel('PSD (V^2/Hz)')
    plt.savefig('psd_plot.png')
    return render_template('psd_plot.html')

if __name__ == '__main__':
    app.run(port=8081)
```

## Random Forest Model

WaveSense includes signal classification using Random Forest models.

### `train.py`

Trains a model on your signal data, including voltage values and derivatives. The model is saved as a `.joblib` file.

### `pred.py`

Uses the trained model to predict new signal data.

#### Train the model:

```bash
python src/py/train.py data/training your_model_name period_length
```

#### Predict with the model:

```bash
python src/py/pred.py your_model_name data/known period_length
```

## Web Workers

WaveSense uses a web worker to handle data recording without blocking the main thread.

### Example `recordingWorker.js`

```javascript
let recordedData = [];

self.onmessage = function(e) {
  if (e.data.type === 'startRecording') { /* Start recording */ }
  else if (e.data.type === 'stopRecording') { /* Stop recording and save */ }
};
```

## Available Scripts

- `npm start`: Run the app in development mode.
- `npm run build`: Build the app for production.
- `python src/py/train.py`: Train a Random Forest model.
- `python src/py/pred.py`: Predict using a trained model.

## App Structure

```
wavesense-react/
├── public/            # Static assets
├── src/               # Source code
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript code
│   └── py/            # Python code (training, prediction, PSD estimation)
├── data/              # Signal data
└── config/            # Configuration files
```

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes.
4. Push the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.
