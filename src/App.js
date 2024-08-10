import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Chart from './Chart';

function App() {
    const [config, setConfig] = useState(null);
    const [data, setData] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        // Fetch the initial configuration from default.json
        fetch('/config/default.json')
            .then((response) => response.json())
            .then((configData) => {
                setConfig(configData);  // Set config state with loaded data
            })
            .catch((error) => {
                console.error('Error loading config:', error);
            });
    }, []);

    useEffect(() => {
        if (config) {
            // Initialize WebSocket connection once config is loaded
            socketRef.current = new WebSocket(`ws://${config.server.host}:${config.server.port}/`);

            socketRef.current.onopen = () => {
                console.log('WebSocket connection established');
                // Send the initial sampling rate
                socketRef.current.send(JSON.stringify({ samplingRate: config.server.samplingRate }));
            };

            socketRef.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                setData((prevData) => {
                    const newDataPoint = {
                        name: message.name,
                        deltaT: message.deltaT,
                        value: message.value,
                    };
                    const updatedData = [...prevData, newDataPoint];
                    if (updatedData.length > config.numPoints) {
                        updatedData.shift();
                    }
                    return updatedData;
                });
            };

            socketRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            socketRef.current.onclose = () => {
                console.log('WebSocket connection closed');
            };

            // Cleanup WebSocket on component unmount
            return () => {
                socketRef.current.close();
            };
        }
    }, [config]);

    // Handle changes from Sidebar
    const handleConfigChange = (newConfig) => {
        setConfig((prevConfig) => ({
            ...prevConfig,
            ...newConfig,
        }));

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            if (newConfig.samplingRate !== undefined) {
                socketRef.current.send(JSON.stringify({ samplingRate: newConfig.samplingRate }));
            }
            if (newConfig.channel !== undefined) {
                socketRef.current.send(JSON.stringify({ channel: newConfig.channel }));
            }
            if (newConfig.offset !== undefined) {
                socketRef.current.send(JSON.stringify({ offset: newConfig.offset }));
            }
        }
    };

    if (!config) {
        return <div>Loading...</div>;  // Show a loading state until config is ready
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <Sidebar onChange={handleConfigChange} />
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '90%' }}>
                    <Chart data={data} yAxisRange={config.yAxisRange} />
                </div>
            </div>
        </div>
    );
}

export default App;