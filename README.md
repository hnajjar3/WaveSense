# WaveSense React JS

WaveSense React JS is a real-time signal plotting application built with React and Chart.js. It allows users to visualize and interact with data streams in real-time, including features like dark mode, data recording, and dynamic axis scaling.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [WebSocket Server](#websocket-server)
- [Available Scripts](#available-scripts)
- [App Structure](#app-structure)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-Time Plotting:** Visualize live data streams with a customizable number of data points.
- **Dark Mode:** Toggle between light and dark themes for better visibility.
- **Data Recording:** Record incoming data and save it as a JSON file.
- **Dynamic Axis Scaling:** Adjust the y-axis range and the number of x-axis points dynamically.
- **Channel Selection:** Choose between different data channels.
- **Screen Lock:** Freeze the chart to pause live updates without stopping the application.

## Demo

![WaveSense React JS Screenshot](screenshot.png)  
*Screenshot of the application in action.*

## Installation

To get started with WaveSense React JS, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/wavesense-react.git
   cd wavesense-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the WebSocket server:**  
   Ensure you have a WebSocket server running that streams data in the expected format. Instructions for setting up a simple server are provided below.

4. **Run the development server:**
   ```bash
   npm start
   ```

## Usage

Once the application is running, you can interact with the various controls available in the sidebar:

- **Dark Mode Toggle:** Switch between light and dark themes.
- **Record Data:** Start recording incoming data; click again to save the data as a JSON file.
- **Offset:** Adjust the signal offset value.
- **Y-Axis Min/Max:** Set the minimum and maximum values for the y-axis.
- **X-Axis Points:** Define the number of data points to display on the x-axis.
- **Sampling Rate:** Control the rate at which data points are sampled (1 = max rate).
- **Channel Selection:** Choose between available data channels (ch0, ch1, ch2, ch3).
- **Lock/Unlock Screen:** Freeze the chart to pause updates, then unlock to resume.

## WebSocket Server

WaveSense React JS requires a WebSocket server that streams JSON data in the following format:

```json
{
  "n": 0,
  "signal": 0.5877852522924731
}
```

The `n` value represents the sample number, and `signal` is the corresponding voltage or data value.

### Example WebSocket Server

Below is a basic Node.js WebSocket server that you can use to test the application:

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('Client connected');

  let n = 0;
  setInterval(() => {
    const signal = Math.sin(n / 10); // Example signal
    ws.send(JSON.stringify({ n, signal }));
    n++;
  }, 100);

  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server running on ws://localhost:8080');
```

Save this code in a file called `server.js` and run it using Node.js:

```bash
node server.js
```

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in the development mode.
- `npm run build`: Builds the app for production.
- `npm run lint`: Lints the code for potential issues.
- `npm run test`: Launches the test runner.

## App Structure

```
wavesense-react/
│
├── public/                     # Static assets
│   ├── index.html              # Main HTML file
│   └── ...
│
├── src/                        # Source files
│   ├── App.js                  # Main app component
│   ├── App.css                 # Global styles
│   ├── darkMode.css            # Dark mode styles
│   ├── DarkModeToggle.js       # Dark mode toggle component
│   ├── recordingWorker.js      # Web worker for recording data
│   └── ...
│
├── package.json                # Project metadata and dependencies
└── README.md                   # Project documentation
```

## Customization

### Modifying Styles

You can customize the look and feel of the application by editing the `App.css` and `darkMode.css` files. These files control the global styles and the dark mode theme, respectively.

### Adding New Features

Feel free to fork the repository and add new features as needed. Contributions are welcome!

## Contributing

If you'd like to contribute to WaveSense React JS, please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes.
4. Commit your changes: `git commit -m 'Add some feature'`.
5. Push to the branch: `git push origin feature/your-feature-name`.
6. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
