/* eslint-disable no-restricted-globals */

// Initialize necessary variables
let recordedData = [];
let isRecording = false;

// Set up the WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = function (event) {
  if (isRecording) {
    let { n, signal } = JSON.parse(event.data);
    recordedData.push({ sample: n, voltage: signal });
  }
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

// Convert recorded data to CSV format
function convertToCSV(data) {
  const header = 'sample,voltage\n';
  const rows = data.map(item => `${item.sample},${item.voltage}`).join('\n');
  return header + rows;
}

// Handle incoming messages from the main thread
self.onmessage = function (e) {
  const { type } = e.data;

  if (type === 'startRecording') {
    console.log('Recording started');
    isRecording = true;
  } else if (type === 'stopRecording') {
    console.log('Recording stopped');
    isRecording = false;

    // Save data as CSV
    const date = new Date();
    const filename = `wavesense_react_voltage_data_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}_${date.getHours()}:${date.getMinutes()}.csv`;
    const csvContent = convertToCSV(recordedData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    self.postMessage({ type: 'download', filename, blob });

    // Clear recorded data after saving
    recordedData = [];
  }
};
