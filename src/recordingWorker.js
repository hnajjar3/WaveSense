/* eslint-disable no-restricted-globals */

let recordedData = [];
let isRecording = false;

self.onmessage = function (e) {
  const { type } = e.data;

  if (type === 'startRecording') {
    isRecording = true;
  } else if (type === 'stopRecording') {
    isRecording = false;

    // Save data as JSON
    const date = new Date();
    const filename = `wavesense_react_voltage_data_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}_${date.getHours()}:${date.getMinutes()}.json`;
    const blob = new Blob([JSON.stringify(recordedData)], { type: 'application/json' });
    self.postMessage({ type: 'download', filename, blob });

    // Clear recorded data after saving
    recordedData = [];
  }
};

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
