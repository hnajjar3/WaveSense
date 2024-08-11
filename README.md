Certainly! Here's a template for a detailed `README.md` document. You can adjust the content according to your specific project details.

---

# WaveSense React

## Overview

WaveSense React is a web-based smart oscilloscope application built using React, Express, and WebSocket. The application allows users to visualize real-time signals and select different waveform channels (sine, square, triangular, sawtooth) through an interactive interface. The server generates and streams the signal data to the client, which is displayed using Recharts.

## Features

- **Real-Time Signal Visualization:** Display live data on an interactive chart.
- **Channel Selection:** Choose from four different signal types: Sine, Square, Triangular, and Sawtooth.
- **Client-Side Control:** Adjust the signal offset and sampling rate from the client interface.
- **WebSocket Communication:** Stream data in real-time from the server to the client using WebSocket.
- **Single Port Serving:** Serve both the client application and WebSocket communication on the same port to avoid CORS issues.

## Directory Structure

```plaintext
wavesense-react/
├── build/                       # Production build directory
├── public/                      # Public assets
│   ├── config/                  # Configuration files
│   │   └── default.json
│   ├── favicon.ico
│   ├── index.html               # Entry point for the React app
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src/                         # Source files
│   ├── App.css
│   ├── App.js                   # Main React component
│   ├── App.test.js
│   ├── Chart.js                 # Chart component for displaying signals
│   ├── Sidebar.js               # Sidebar component for controls
│   ├── Toggle.js                # Dark mode toggle component
│   ├── darkMode.css
│   ├── functionGenerator.js      # Signal generation functions
│   ├── index.css
│   ├── index.js                 # Main entry point
│   ├── logo.svg
│   ├── reportWebVitals.js
│   ├── server.js                # Express server and WebSocket setup
│   ├── setupTests.js
│   └── signalGenerator.js       # Signal generation logic for WebSocket
├── package.json                 # Project dependencies and scripts
├── package-lock.json
└── README.md                    # Project documentation
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/) (version 6.x or higher)

### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/wavesense-react.git
   cd wavesense-react
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the React app:**

   ```bash
   npm run build
   ```

4. **Run the server:**

   ```bash
   node src/server.js
   ```

5. **Access the application:**

   Open your browser and navigate to `http://localhost:8080`.

## Usage

### Channel Selection

- Use the dropdown menu in the sidebar to select between different waveform channels:
  - **Sine Wave (ch0)**
  - **Square Wave (ch1)**
  - **Triangular Wave (ch2)**
  - **Sawtooth Wave (ch3)**

### Adjusting Signal Parameters

- **Offset:** Modify the signal offset using the provided input field in the sidebar.
- **Sampling Rate:** Control the sampling rate of the signal data displayed on the chart.

### Real-Time Data Streaming

- The server continuously streams signal data to the client using WebSocket. The data is visualized on the chart in real-time.

## Development

### Running the Development Server

To run the React development server on port 8080:

```bash
npm start
```

This command uses `react-scripts` to start the development server. The app will automatically reload if you make changes to any of the source files.

### WebSocket Server

The WebSocket server is integrated into the Express server and runs on the same port (8080) to avoid CORS issues. It streams signal data to the client in real-time.

## Configuration

The application uses a configuration file located at `public/config/default.json` for setting default values like the sampling rate.

### Example Configuration (`default.json`)

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "samplingRate": 10
  },
  "signals": {
    "minMaxValues": {
      "0": { "min": -1, "max": 1 },
      "1": { "min": -1, "max": 1 },
      "2": { "min": -1, "max": 1 },
      "3": { "min": -1, "max": 1 }
    }
  }
}
```

## Troubleshooting

### Common Issues

- **Port Conflicts:** Ensure no other service is running on port 8080.
- **Missing Dependencies:** If you encounter issues during the build process, try running `npm install` to ensure all dependencies are installed.
- **CORS Errors:** CORS issues have been avoided by serving the client and server on the same port. If you encounter CORS-related errors, ensure that both the client and server are properly configured.

### Logs

Check the server logs in the terminal for any error messages or status updates when running the application.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Recharts](https://recharts.org/)

---

This `README.md` document provides a comprehensive guide to setting up, using, and developing the WaveSense React application. Feel free to customize any part of this template to better fit your project's needs. Let me know if you need further assistance!