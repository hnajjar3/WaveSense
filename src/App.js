import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import Algebrite from 'algebrite'; // Import Algebrite
import './App.css';
import './darkMode.css';
import { DarkModeToggle } from './DarkModeToggle';

Chart.register(...registerables);

function App() {
  const chartRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [yMin, setYMin] = useState(-1);
  const [yMax, setYMax] = useState(1);
  const [points, setPoints] = useState(100);
  const [samplingRate, setSamplingRate] = useState(1);
  const [channel, setChannel] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [formula, setFormula] = useState('x'); // Add state to hold the formula

  const sampleCounter = useRef(0);

  // Effect to handle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addData = (chart, label, newData) => {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
      dataset.data.push(newData);
    });
    chart.update();
  };

  const removeData = (chart) => {
    chart.data.labels.shift();
    chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
    chart.update();
  };

  // Ensure that when points is reduced, excess data is removed
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      while (chart.data.labels.length > points) {
        removeData(chart);
      }
    }
  }, [points]);

  // Function to apply the formula to the signal
  const applyFormula = (signal, formula) => {
    try {
      console.log(`Expression ${formula}`);
      // Simplify the formula expression first
      const simplifiedExpression = Algebrite.simplify(formula).toString();
      console.log(`Simplified Expression: ${simplifiedExpression}`);

      // Substitute the signal value into the expression
      const substitutedExpression = simplifiedExpression.replace(/x/g, `(${signal})`);
      console.log(`Substituted Expression: ${substitutedExpression}`);

      // Evaluate the expression to get a numeric result
      const numericResult = Algebrite.run(`float(${substitutedExpression})`).toString();
      console.log(`Numeric Result: ${numericResult}`);

      return parseFloat(numericResult);
    } catch (error) {
      console.error('Error applying formula:', error);
      return signal; // Fallback to original signal if there's an error
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      // Save data as JSON
      const date = new Date();
      const filename = `wavesense_react_voltage_data_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}_${date.getHours()}:${date.getMinutes()}.json`;
      const blob = new Blob([JSON.stringify(recordedData)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      // Clear recorded data after saving
      setRecordedData([]);
    }
    setIsRecording(!isRecording);
  };

  // WebSocket handling
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      if (!isLocked) {  // Only update the chart if it is not locked
        let { n, signal } = JSON.parse(event.data);
        signal = signal + offset;

        // Apply the formula to the signal
        const calculatedSignal = applyFormula(signal, formula);

        sampleCounter.current++;
        if (sampleCounter.current >= samplingRate) {
          if (chartRef.current.data.labels.length >= points) {
            removeData(chartRef.current);
          }

          addData(chartRef.current, n, calculatedSignal);

          if (isRecording) {
            setRecordedData((prevData) => [...prevData, { sample: n, voltage: calculatedSignal }]);
          }

          sampleCounter.current = 0;
        }
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [isLocked, offset, points, samplingRate, isRecording, formula]);

  const handleChannelChange = async (event) => {
    const selectedChannel = parseInt(event.target.value, 10);
    setChannel(selectedChannel);

    try {
      const response = await fetch('http://localhost:8080/set-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel: selectedChannel }),
      });

      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error('Error setting channel:', error);
    }
  };

  const data = {
    labels: chartRef.current?.data.labels || [],  // Start with current labels if available
    datasets: [
      {
        label: 'Signal',
        data: chartRef.current?.data.datasets[0]?.data || [],  // Start with current data if available
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
        <DarkModeToggle />
        <div>
          <button onClick={() => setIsLocked(!isLocked)}>
            {isLocked ? 'Unlock Screen' : 'Lock Screen'}
          </button>
        </div>
        <div>
          <button onClick={handleRecordToggle}>
            {isRecording ? 'Save Data' : 'Record Data'}
          </button>
        </div>
        <div>
          <label>
            Offset:
            <input
              type="number"
              value={offset}
              step="0.1"
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
        <div style={{ marginTop: '20px' }}>
          <label>
            Channel:
            <select value={channel} onChange={handleChannelChange} style={{ marginLeft: '10px' }}>
              <option value="0">ch0</option>
              <option value="1">ch1</option>
              <option value="2">ch2</option>
              <option value="3">ch3</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <label>
            Formula (y = ...):
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>
      </div>
      <div style={{ width: '80%', padding: '10px' }}>
        <h1>WaveSense React JS</h1>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

export default App;
