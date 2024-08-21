import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import Algebrite from 'algebrite'; // Import Algebrite
import { Container, Row, Col, Button, Form, Modal } from 'react-bootstrap'; // Import Form and other Bootstrap components
import { DarkModeToggle } from './DarkModeToggle';
import FilterSettingsModal from './FilterSettingsModal'; // Import the modal
import '../css/App.css';
import '../css/darkMode.css';

Chart.register(...registerables);

const SignalPlotter = () => {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const recordingWorker = useRef(null);
  const statsWorker = useRef(null);
  const [serverPort, setPort] = useState(80);
  const [isConnected, setIsConnected] = useState(false);
  const [offset, setOffset] = useState(0);
  const [yMin, setYMin] = useState(-1);
  const [yMax, setYMax] = useState(1);
  const [points, setPoints] = useState(100);
  const [subsampling, setSubsampling] = useState(1);
  const [channel, setChannel] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [formula, setFormula] = useState('x');
  const [configLoaded, setConfigLoaded] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const alphaRef = useRef(0.2);
  const filteringEnabledRef = useRef(true);
  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState(false);
  const [stats, setStats] = useState({
    max: 'N/A',
    min: 'N/A',
    mean: 'N/A',
    rms: 'N/A',
  });

  const isLockedRef = useRef(false);
  const subsamplingRef = useRef(1);
  const offsetRef = useRef(0);
  const pointsRef = useRef(100);
  const sampleCounter = useRef(0);
  const formulaRef = useRef('x');
  const previousFiltered = useRef(0);

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

  // Handle changes from modal without causing re-renders
  const handleAlphaChange = (newAlpha) => {
    alphaRef.current = newAlpha;
  };

  const handleFilteringEnabledChange = (newFilteringEnabled) => {
    filteringEnabledRef.current = newFilteringEnabled;
  };

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
        setOffset(0);
        setYMin(-1);
        setYMax(1);
        setPoints(100);
        setSubsampling(1);
        setChannel(0);
        setConfigLoaded(true);
      });
  }, []);

  // Effect to handle Dark Mode
  useEffect(() => {
  console.log(`Toggling dark ${isDarkMode}`)
  if (chartRef.current) {
    const chart = chartRef.current;
    // 
    document.body.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('light', !isDarkMode);

    // Update chart options based on dark mode
    chart.options.scales.x.ticks.color = isDarkMode ? '#ffffff' : '#000000';
    chart.options.scales.y.ticks.color = isDarkMode ? '#ffffff' : '#000000';
    chart.options.scales.x.grid.color = isDarkMode ? '#666666' : '#cccccc';
    chart.options.scales.y.grid.color = isDarkMode ? '#666666' : '#cccccc';

    // Update the background of the chart
    chart.options.plugins.tooltip.backgroundColor = isDarkMode ? '#333333' : '#ffffff';
    chart.options.plugins.tooltip.titleColor = isDarkMode ? '#ffffff' : '#000000';
    chart.options.plugins.tooltip.bodyColor = isDarkMode ? '#ffffff' : '#000000';

    chart.update(); // Trigger chart update to apply new options
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
      // Dynamically set the canvas background color based on the current dark mode
      const ctx = chart.ctx;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = isDarkMode ? '#1f1f1f' : '#ffffff'; // Dark or light background
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();

      // Capture the screenshot
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

  // Function to handle opening the modal
  const handleShowModal = () => {
    setShowFilterModal(true);
  };

  // Function to handle closing the modal
  const handleCloseModal = () => {
    setShowFilterModal(false);
  };

  // WebSocket handling
  useEffect(() => {
    if (configLoaded) {
      let ws;

      const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:${serverPort}`);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isLockedRef.current) {
            try {
              let { n, signal } = JSON.parse(event.data);

              // Initialize previousFiltered on the first signal
              if (previousFiltered.current === 0) {
                previousFiltered.current = signal;
              }

              // Apply offset
              signal = signal + offsetRef.current;

              // Apply leaky integrator only if filtering is enabled
              if (filteringEnabledRef.current) {
                signal = alphaRef.current * signal + (1 - alphaRef.current) * previousFiltered.current;
              }

              previousFiltered.current = signal;

              const calculatedSignal = applyFormula(previousFiltered.current);

              sampleCounter.current++;

              if (chartRef.current && chartRef.current.data && sampleCounter.current >= Math.max(1, subsamplingRef.current)) {
                if (chartRef.current.data.labels.length >= pointsRef.current) {
                  removeData(chartRef.current);
                }

                addData(chartRef.current, n, calculatedSignal);

                if (isRecording) {
                  setRecordedData((prevData) => [...prevData, { sample: n, voltage: calculatedSignal }]);
                }

                statsWorker.current.postMessage({
                  action: 'process',
                  n: n,
                  signal: calculatedSignal,
                });

                sampleCounter.current = 0;
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWebSocket, 5000);
        };
      };

      connectWebSocket();

      return () => {
        ws.close();
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


  const custom_canvas_background_color = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart) => {
      const {
        ctx,
        chartArea: { top, right, bottom, left, width, height },
      } = chart;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = isDarkMode ? '#1f1f1f' : '#ffffff'; // Use dark or light background
      ctx.fillRect(left, top, width, height);
      ctx.restore();
    },
  };

  const options = {
  plugins: [custom_canvas_background_color],
  animation: false, // Disable animation
  scales: {
    y: {
      min: yMin,
      max: yMax,
      ticks: {
        stepSize: 0.5,
        color: isDarkMode ? '#ffffff' : '#000000', // Dynamic text color
      },
      grid: {
        color: isDarkMode ? '#666666' : '#cccccc', // Dynamic grid color
      },
    },
    x: {
      ticks: {
        color: isDarkMode ? '#ffffff' : '#000000', // Dynamic text color
      },
      grid: {
        color: isDarkMode ? '#666666' : '#cccccc', // Dynamic grid color
      },
    }
  },
  plugins: {
    tooltip: {
      enabled: true,
      mode: 'nearest',
      intersect: false,
      external: function (context) {
        const { chart, tooltip } = context;
        const tooltipEl = chart.canvas.parentNode.querySelector('div.tooltip');

        if (!tooltipEl) return;

        if (tooltip.opacity === 0) {
          tooltipEl.style.opacity = 0;
          return;
        }

        const position = chart.canvas.getBoundingClientRect();
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = position.left + window.pageXOffset + tooltip.caretX + 'px';
        tooltipEl.style.top = position.top + window.pageYOffset + tooltip.caretY + 'px';

        tooltipEl.style.backgroundColor = isDarkMode ? '#333333' : '#ffffff';
        tooltipEl.style.color = isDarkMode ? '#ffffff' : '#000000';
      }
    },
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = isDarkMode ? '#1f1f1f' : '#ffffff'; // Dynamic background color
      ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
      ctx.restore();
    }
  }
};

  return (
    <Container fluid className={`SignalPlotter d-flex p-3 ${isDarkMode ? 'body.dark' : 'body.light'}`}>
    <Col md={1} className="sidebar border-right" style={{ padding: '10px', width: '10%' }}>
      <h2>Controls</h2>
      <div className="control-section">
        {/* Place DarkModeToggle inside the sidebar */}
        <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>
      <div className="control-section">
        <h4>Screen Lock</h4>
        <Button
          className="mb-3"
          variant={isLocked ? 'danger' : 'success'}
          onClick={() => {
            const newLockState = !isLocked;
            setIsLocked(newLockState);
            console.log('Lock Screen Toggled:', newLockState);
          }}
          style={{ width: '100%' }}
        >
          {isLocked ? 'Unlock Screen' : 'Lock Screen'}
        </Button>
      </div>

      <div className="control-section">
        <h4>Recording</h4>
        <Button className="mb-3" onClick={handleRecordToggle} style={{ width: '100%' }}>
          {isRecording ? 'Save Data' : 'Record Data'}
        </Button>
        <Button className="mb-3" onClick={handleScreenshot} style={{ width: '100%' }}>
          Capture Screenshot
        </Button>
      </div>

      <div className="control-section">
        <h4>Settings</h4>
        <Button className="mb-3" onClick={() => setShowFilterModal(true)} style={{ width: '100%' }}>
          Filter Settings
        </Button>
        <Button className="mb-3" onClick={handlePsdClick} style={{ width: '100%' }}>
          Periodogram
        </Button>
        <Button className="mb-3" onClick={handleFuncGenClick} style={{ width: '100%' }}>
          Function Generator
        </Button>
      </div>

      <div className="control-section">
        <h4>Adjustments</h4>
        <Button className="mb-3" onClick={() => setShowAdjustmentsModal(true)} style={{ width: '100%' }}>
          Adjust Chart
        </Button>
        {/* Modal for Offset Adjustment */}
        <Modal show={showAdjustmentsModal} onHide={() => setShowAdjustmentsModal(false)} centered size="sm" dialogClassName="custom-modal">
          <Modal.Header closeButton>
            <Modal.Title>Adjustments</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Offset */}
            <Form.Group className="mb-3">
              <Form.Label>Offset:</Form.Label>
              <Form.Control
                type="number"
                value={offset}
                step="0.1"
                onChange={(e) => setOffset(Number(e.target.value))}
              />
            </Form.Group>

            {/* Y-Axis Min */}
            <Form.Group className="mb-3">
              <Form.Label>Y-Axis Min:</Form.Label>
              <Form.Control
                type="number"
                value={yMin}
                onChange={(e) => setYMin(Number(e.target.value))}
              />
            </Form.Group>

            {/* Y-Axis Max */}
            <Form.Group className="mb-3">
              <Form.Label>Y-Axis Max:</Form.Label>
              <Form.Control
                type="number"
                value={yMax}
                onChange={(e) => setYMax(Number(e.target.value))}
              />
            </Form.Group>

            {/* X-Axis Points */}
            <Form.Group className="mb-3">
              <Form.Label>X-Axis Points:</Form.Label>
              <Form.Control
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </Form.Group>

            {/* Subsampling */}
            <Form.Group className="mb-3">
              <Form.Label>Subsampling (1 = Min):</Form.Label>
              <Form.Control
                type="number"
                value={subsampling}
                onChange={(e) => setSubsampling(Math.max(1, Number(e.target.value)))}
                min="1"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="secondary" onClick={() => setShowAdjustmentsModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setShowAdjustmentsModal(false)}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <Form.Group className="mb-3">
          <Form.Label>Channel:</Form.Label>
          <Form.Control as="select" value={channel} onChange={handleChannelChange}>
            <option value="0">ch0</option>
            <option value="1">ch1</option>
            <option value="2">ch2</option>
            <option value="3">ch3</option>
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Conversion formula (y = ...):</Form.Label>
          <Form.Control
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
          />
        </Form.Group>
      </div>
    </Col>
    <Col md={11} className={`p-auto ${isDarkMode ? 'body.dark' : 'body.light'}`}>
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
        {/* Dynamically update the chart when dark mode changes */}
        <FilterSettingsModal
          show={showFilterModal}
          handleClose={() => setShowFilterModal(false)}
          alpha={alphaRef.current}
          setAlpha={handleAlphaChange}
          filteringEnabled={filteringEnabledRef.current}
          setFilteringEnabled={handleFilteringEnabledChange}
        />
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
