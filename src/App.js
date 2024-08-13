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
  const recordingWorker = useRef(null)
  const statsWorker = useRef(null); // Initialize statsWorker
  const [isConnected, setIsConnected] = useState(false);
  const [offset, setOffset] = useState(0); // Add default value
  const [yMin, setYMin] = useState(-1); // Add default value
  const [yMax, setYMax] = useState(1); // Add default value
  const [points, setPoints] = useState(100); // Add default value
  const [subsampling, setSubsampling] = useState(1); // Add default value
  const [channel, setChannel] = useState(0); // Add default value
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [formula, setFormula] = useState('x');
  const [configLoaded, setConfigLoaded] = useState(true); // Initialize configLoaded state
  const [stats, setStats] = useState({
    max: 'N/A',
    min: 'N/A',
    mean: 'N/A',
    rms: 'N/A',
    deltaX: 'N/A',
    deltaY: 'N/A'
  });
  // Use refs to store current state values
  const isLockedRef = useRef(false)
  const subsamplingRef = useRef(1);
  const offsetRef = useRef(0);
  const pointsRef = useRef(100);
  const sampleCounter = useRef(0);
  const formulaRef = useRef('x');

  useEffect(() => {
  subsamplingRef.current = subsampling;
  console.log(`update subsampling ${subsamplingRef.current}`);
}, [subsampling]);

useEffect(() => {
  offsetRef.current = offset;
  console.log(`update offset ${offsetRef.current}`);
}, [offset]);

useEffect(() => {
  pointsRef.current = points;
  console.log(`update points ${pointsRef.current}`);
}, [points]);

useEffect(() => {
  formulaRef.current = formula;
  console.log(`update formula ${formulaRef.current}`);
}, [formula]);

useEffect(() => {
  isLockedRef.current = isLocked;
  console.log('isLocked state changed:', isLockedRef.current);
}, [isLocked]);

useEffect(() => {
  recordingWorker.current = new Worker(new URL('./recordingWorker.js', import.meta.url));

  recordingWorker.current.onmessage = (e) => {
    if (e.data.type === 'download') {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(e.data.blob);
      link.download = e.data.filename;
      link.click();
      console.log('Download triggered');
    }
  };

  return () => {
    recordingWorker.current.terminate(); // Clean up the worker when the component unmounts
  };
}, []);

// Compute statistics
useEffect(() => {
  statsWorker.current = new Worker(new URL('./statsWorker.js', import.meta.url));

  statsWorker.current.postMessage({ action: 'start' });

  statsWorker.current.onmessage = (e) => {
    setStats(e.data);
  };

  return () => {
    statsWorker.current.terminate();
  };
}, []);

// initialize parameters from config file
  useEffect(() => {
    fetch('/config.json')
      .then((response) => response.json())
      .then((config) => {
        setOffset(config.bias);
        setYMin(-config.yRange);
        setYMax(config.yRange);
        setPoints(config.maxPoints);
        setSubsampling(config.subsampling);
        setChannel(config.channel);
        setConfigLoaded(true);
        console.log('Loading config.json parameters!')
      })
      .catch((error) => {
        console.error('Error fetching config:', error);
        // Set default values if the config fails to load
        setOffset(0); // default bias
        setYMin(-1); // default yMin
        setYMax(1); // default yMax
        setPoints(100); // default points
        setSubsampling(1); // default subsampling rate
        setChannel(0); // default channel
        setConfigLoaded(true); // Proceed with default settings
      });
  }, []);

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

  // Ensure that when points are reduced, excess data is removed
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      while (chart.data.labels.length > pointsRef.current) {
        removeData(chart);
      }
    }
  }, [points]);

  // Function to apply the formula to the signal
  const applyFormula = (signal) => {
    try {
      //console.log(`Expression ${formula}`);
      // Simplify the formula expression first
      const simplifiedExpression = Algebrite.simplify(formulaRef.current).toString();
      //console.log(`Simplified Expression: ${simplifiedExpression}`);

      // Substitute the signal value into the expression
      const substitutedExpression = simplifiedExpression.replace(/x/g, `(${signal})`);
      //console.log(`Substituted Expression: ${substitutedExpression}`);

      // Evaluate the expression to get a numeric result
      const numericResult = Algebrite.run(`float(${substitutedExpression})`).toString();
      //console.log(`Numeric Result: ${numericResult}`);

      return parseFloat(numericResult);
    } catch (error) {
      console.log('Error applying formula:', error);
      return signal; // Fallback to original signal if there's an error
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      recordingWorker.current.postMessage({ type: 'stopRecording' });
    } else {
      recordingWorker.current.postMessage({ type: 'startRecording' });
    }
    setIsRecording(!isRecording);
  };

  // WebSocket handling
  useEffect(() => {
    if (configLoaded) {
      let ws;

      const connectWebSocket = () => {
        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
            if (!isLockedRef.current) {
                let { n, signal } = JSON.parse(event.data);
                signal = signal + offsetRef.current;

                const calculatedSignal = applyFormula(signal, formulaRef.current);

                sampleCounter.current++;
                if (sampleCounter.current >= Math.max(1, subsamplingRef.current)) {
                    if (chartRef.current.data.labels.length >= pointsRef.current) {
                        removeData(chartRef.current);
                    }

                    addData(chartRef.current, n, calculatedSignal);

                    if (isRecording) {
                        setRecordedData((prevData) => [...prevData, { sample: n, voltage: calculatedSignal }]);
                    }

                    // Send data to statsWorker for processing
                    statsWorker.current.postMessage({
                        action: 'process',
                        n: n,
                        signal: calculatedSignal
                    });

                    sampleCounter.current = 0;
                }
            } else {
                console.log(`Screen is locked!`);
            }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed. Attempting to reconnect...');
          setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
          setIsConnected(false);
        };
      } ;

      connectWebSocket(); // Initial connection

      return () => {
        ws.close(); // Clean up on component unmount
      };
    }
  }, [configLoaded]);

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
      console.log('Error setting channel:', error);
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
    animation: false, // Disable animation
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
        <button onClick={() => {
          const newLockState = !isLocked;
          setIsLocked(newLockState);
          console.log('Lock Screen Toggled:', newLockState); // Debugging statement
        }}>
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
            Subsampling (1 = Min):
            <input
              type="number"
              value={subsampling}
              onChange={(e) => setSubsampling(Math.max(1, Number(e.target.value)))}
              style={{ marginLeft: '10px' }}
              min="1"
              step="1"  // This ensures the arrows increase/decrease by 1
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
            Conversion formula (y = ...):
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
        {!isConnected && <p>Reconnecting to WebSocket...</p>}
        <Line ref={chartRef} data={data} options={options} />
        <div style={{ position: 'absolute', top: 10, right: 10, textAlign: 'right' }}>
          <h3>Statistics</h3>
          <p>Max: {stats.max}</p>
          <p>Min: {stats.min}</p>
          <p>Mean: {stats.mean}</p>
          <p>RMS: {stats.rms}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
