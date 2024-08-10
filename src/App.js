import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Chart from './Chart';
import { generateFunction } from './signalGenerator';

function App() {
    const [config, setConfig] = useState({ yAxisRange: 10, yOffset: 0, channel: 0 });
    const [data, setData] = useState([]);

    useEffect(() => {
        let x = 0;

        const generateNextPoint = () => {
            x += 1;
            return {
                name: `Point ${x}`,
                value: generateFunction(x, config.channel) + config.yOffset,
            };
        };

        let initialData = [];
        for (let i = 0; i < 100; i++) {
            initialData.push(generateNextPoint());
        }
        setData(initialData);

        const interval = setInterval(() => {
            setData((prevData) => {
                const newDataPoint = generateNextPoint();
                return [...prevData.slice(1), newDataPoint];
            });
        }, 100);

        return () => clearInterval(interval);
    }, [config.channel, config.yAxisRange, config.yOffset]);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
            <Sidebar onChange={setConfig} />
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '90%' }}>
                    <Chart data={data} yAxisRange={config.yAxisRange} />
                </div>
            </div>
        </div>
    );
}

export default App;
