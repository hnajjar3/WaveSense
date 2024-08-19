import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import Algebrite from 'algebrite'; // Import Algebrite
import { Container, Row, Col, Button, Form } from 'react-bootstrap'; // Import Form and other Bootstrap components
import { DarkModeToggle } from './DarkModeToggle';
import '../css/App.css';
import '../css/darkMode.css';

Chart.register(...registerables);

function SignalPlotter() {
  const navigate = useNavigate(); // Initialize useNavigate
  const chartRef = useRef(null);
  const recordingWorker = useRef(null);
  const statsWorker = useRef(null); // Initialize statsWorker
  const [serverPort, setPort] = useState(80)
  const [isConnected, setIsConnected] = useState(false);
  const [offset, setOffset] = useState(0); // Add default value
  const [yMin, setYMin] = useState(-1); // Add default value
  const [yMax, setYMax] = useState(1); // Add default value
  const [points, setPoints] = useState(100); // Add default value
  const [subsampling, setSubsampling] = useState(1); // Add default value
  const [channel, setChannel] = useState(0); // Add default value
  const [isDarkMode, setIsDarkMode] = useState(true);
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
  });

  // Use refs to store current state values
  const isLockedRef = useRef(false);
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

  // Initialize parameters from config file
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
        console.log('Loading config.json parameters!');
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
    console.log("Current body classList:", document.body.classList);  // Debug
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
      // Simplify the formula expression first
      const simplifiedExpression = Algebrite.simplify(formulaRef.current).toString();

      // Substitute the signal value into the expression
      const substitutedExpression = simplifiedExpression.replace(/x/g, `(${signal})`);

      // Evaluate the expression to get a numeric result
      const numericResult = Algebrite.run(`float(${substitutedExpression})`).toString();

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
      recordingWorker.current.postMessage({ type: 'startRecording', serverPort });  // Send serverPort when starting the recording
    }
    setIsRecording(!isRecording);
  };

  const handleScreenshot = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `waveform_screenshot_${new Date().toISOString()}.png`;
      link.click();
      console.log('Screenshot captured');
    }
  };

  // Go to PSD API route
  const handlePsdClick = () => {
    navigate('/periodogram'); // Use navigate to go to /periodogram
  };

  // Navigate to Function Generator Control
  const handleFuncGenClick = () => {
    navigate('/func-gen-ctl');
  };

  // WebSocket handling
  useEffect(() => {
    if (configLoaded) {
      let ws;

      const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:${serverPort}`);

        ws.onopen = () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isLockedRef.current) {
            console.log(`${event.data}`);

            try {
              let { n, signal } = JSON.parse(event.data);
              signal = signal + offsetRef.current;

              const calculatedSignal = applyFormula(signal);

              sampleCounter.current++;

              // Check if the chart exists and is available
              if (chartRef.current && chartRef.current.data && sampleCounter.current >= Math.max(1, subsamplingRef.current)) {
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
                  signal: calculatedSignal,
                });

                sampleCounter.current = 0;
              } else {
                console.log('Chart is not available on this route');
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          } else {
            console.log('Screen is locked!');
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed. Attempting to reconnect...');
          setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
          setIsConnected(false);
        };
      };

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
          const response = await fetch(`http://localhost:8000/channels/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ channel: selectedChannel }),
          });

          if (!response.ok) {
              throw new Error(`Failed to switch channel: ${response.statusText}`);
          }

          const result = await response.json();
          console.log(`Channel switched to:`, result);
      } catch (error) {
          console.error('Error setting channel:', error);
      }
  };

  const data = {
    labels: chartRef.current?.data.labels || [], // Start with current labels if available
    datasets: [
      {
        label: 'Signal',
        data: chartRef.current?.data.datasets[0]?.data || [], // Start with current data if available
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
      plugins: {
        tooltip: {
          enabled: false, // Disable the default tooltip
          mode: 'nearest',
          intersect: false,
          external: function (context) {
            const { chart, tooltip } = context;
            const tooltipEl = chart.canvas.parentNode.querySelector('div.tooltip');

            if (!tooltipEl) {
              console.error('Tooltip element not found.');
              return;
            }

            // Hide if no tooltip
            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = 0;
              return;
            }

            // Set caret position based on mouse position
            const position = chart.canvas.getBoundingClientRect();

            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = position.left + window.pageXOffset + tooltip.caretX + 'px';
            tooltipEl.style.top = position.top + window.pageYOffset + tooltip.caretY + 'px';

            // Set the content of the tooltip
            if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
              const dataPoint = tooltip.dataPoints[0];
              const value = dataPoint.raw !== undefined ? dataPoint.raw : dataPoint.parsed.y;

              if (value !== undefined && value !== null) {
                tooltipEl.innerHTML = `Value: ${value.toFixed(2)}`; // Format value to 2 decimal places
              } else {
                tooltipEl.innerHTML = `Value: N/A`; // Fallback if value is undefined
              }
            }
          },
        },
      },
  };

  return (
    <Container fluid className={`MainApp d-flex p-3 ${isDarkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
    <Col md={2} className="sidebar border-right"> {/* Apply the 'sidebar' class */}
        <h2>Controls</h2>
        <div className="mb-auto">
          <DarkModeToggle />
        </div>
        <Button
          className="mb-auto"
          variant={isLocked ? 'danger' : 'success'}
          onClick={() => {
            const newLockState = !isLocked;
            setIsLocked(newLockState);
            console.log('Lock Screen Toggled:', newLockState);
          }}
        >
          {isLocked ? 'Unlock Screen' : 'Lock Screen'}
        </Button>
        <Button className="mb-auto" onClick={handleRecordToggle}>
          {isRecording ? 'Save Data' : 'Record Data'}
        </Button>
        <Button className="mb-auto" onClick={handleScreenshot}>
          Capture Screenshot
        </Button>
        <Button className="mb-auto" onClick={handlePsdClick}>
          Periodogram
        </Button>
        <Button className="mb-auto" onClick={handleFuncGenClick}>
        Function Generator
        </Button>
        <Form.Group className="mb-auto">
          <Form.Label>Offset:</Form.Label>
          <Form.Control
            type="number"
            value={offset}
            step="0.1"
            onChange={(e) => setOffset(Number(e.target.value))}
          />
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>Y-Axis Min:</Form.Label>
          <Form.Control
            type="number"
            value={yMin}
            onChange={(e) => setYMin(Number(e.target.value))}
          />
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>Y-Axis Max:</Form.Label>
          <Form.Control
            type="number"
            value={yMax}
            onChange={(e) => setYMax(Number(e.target.value))}
          />
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>X-Axis Points:</Form.Label>
          <Form.Control
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>Subsampling (1 = Min):</Form.Label>
          <Form.Control
            type="number"
            value={subsampling}
            onChange={(e) => setSubsampling(Math.max(1, Number(e.target.value)))}
            min="1"
          />
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>Channel:</Form.Label>
          <Form.Control as="select" value={channel} onChange={handleChannelChange}>
            <option value="0">ch0</option>
            <option value="1">ch1</option>
            <option value="2">ch2</option>
            <option value="3">ch3</option>
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-auto">
          <Form.Label>Conversion formula (y = ...):</Form.Label>
          <Form.Control
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
          />
        </Form.Group>
      </Col>

      <Col md={10} className="p-auto" style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff' }}>
        <h1>WaveSense</h1>
        {!isConnected && <p>Reconnecting to WebSocket...</p>}
        <div className="tooltip"
            style={{
                position: 'absolute',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                borderRadius: '4px',
                padding: '5px',
                opacity: 0,  // Hide tooltip initially
                pointerEvents: 'none',
                transition: 'opacity 0.3s',}}></div>
        <Line ref={chartRef} data={data} options={options} />
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            textAlign: 'right',
          }}
        >
          <h3>Statistics</h3>
          <p>Max: {stats.max}</p>
          <p>Min: {stats.min}</p>
          <p>Mean: {stats.mean}</p>
          <p>RMS: {stats.rms}</p>
        </div>
      </Col>
    </Container>
  );
}

export default SignalPlotter;
