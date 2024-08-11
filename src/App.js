import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function App() {
  const chartRef = useRef(null);  // Reference to the chart instance
  const [offset, setOffset] = useState(0);
  const [yMin, setYMin] = useState(-1);
  const [yMax, setYMax] = useState(1);
  const [points, setPoints] = useState(100);
  const [samplingRate, setSamplingRate] = useState(1); // New state for client-side sampling
  const sampleCounter = useRef(0); // Counter to track how many samples have been skipped

  const addData = (chart, label, newData) => {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(newData);
    });
    chart.update();
  };

  const removeData = (chart) => {
    chart.data.labels.shift();  // Remove the oldest label
    chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();  // Remove the oldest data point
    });
    chart.update();
  };

  useEffect(() => {
    const chartInstance = chartRef.current;  // Get the chart instance
    const ws = new WebSocket('ws://localhost:8081');

    ws.onmessage = (event) => {
      let { n, signal } = JSON.parse(event.data);
      signal = signal + offset;  // Apply offset to the signal

      sampleCounter.current++;
      if (sampleCounter.current >= samplingRate) {
        if (chartInstance.data.labels.length >= points) {
          removeData(chartInstance);  // Remove oldest data when max points reached
        }

        addData(chartInstance, n, signal);  // Add new data point
        sampleCounter.current = 0; // Reset the counter after plotting
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [offset, points, samplingRate]);

  const data = {
    labels: [],
    datasets: [
      {
        label: 'Signal',
        data: [],
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: yMin,
        max: yMax,
        ticks: {
          stepSize: 0.5,
        },
      },
    },
  };

  return (
    <div className="App" style={{ display: 'flex' }}>
      <div style={{ width: '20%', padding: '10px', borderRight: '1px solid #ccc' }}>
        <h2>Controls</h2>
        <div>
          <label>
            Offset:
            <input
              type="number"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>
            Y-Axis Min:
            <input
              type="number"
              value={yMin}
              onChange={(e) => setYMin(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>
            Y-Axis Max:
            <input
              type="number"
              value={yMax}
              onChange={(e) => setYMax(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>
            X-Axis Points:
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>
            Sampling Rate (1 = Max):
            <input
              type="number"
              value={samplingRate}
              onChange={(e) => setSamplingRate(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
              min="1"
            />
          </label>
        </div>
      </div>
      <div style={{ width: '80%', padding: '10px' }}>
        <h1>Real-Time Signal Plotter</h1>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

export default App;