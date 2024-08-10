import React, { useState } from 'react';

function Sidebar({ onChange }) {
    const [yAxisRange, setYAxisRange] = useState(10);
    const [yOffset, setYOffset] = useState(0);
    const [channel, setChannel] = useState(0);
    const [numPoints, setNumPoints] = useState(100);
    const [samplingRate, setSamplingRate] = useState(1000);

    const handleYAxisRangeChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setYAxisRange(value);
        onChange({ yAxisRange: value, yOffset, channel, numPoints, samplingRate });
    };

    const handleYOffsetChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setYOffset(value);
        onChange({ yAxisRange, yOffset: value, channel, numPoints, samplingRate, offset: value });
    };

    const handleChannelChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setChannel(value);
        onChange({ yAxisRange, yOffset, channel: value, numPoints, samplingRate });
    };

    const handleNumPointsChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setNumPoints(value);
        onChange({ yAxisRange, yOffset, channel, numPoints: value, samplingRate });
    };

    const handleSamplingRateChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setSamplingRate(value);
        onChange({ yAxisRange, yOffset, channel, numPoints, samplingRate: value });
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', width: '20%', height: '100vh' }}>
            <h3>Controls</h3>
            <div>
                <label>Y-Axis Range:</label>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={yAxisRange}
                    onChange={handleYAxisRangeChange}
                />
                <span>{yAxisRange}</span>
            </div>
            <div>
                <label>Y-Axis Offset:</label>
                <input
                    type="range"
                    min="-10"
                    max="10"
                    value={yOffset}
                    onChange={handleYOffsetChange}
                />
                <span>{yOffset}</span>
            </div>
            <div>
                <label>Channel:</label>
                <select value={channel} onChange={handleChannelChange}>
                    <option value={0}>ch0 (Sine)</option>
                    <option value={1}>ch1 (Sawtooth)</option>
                    <option value={2}>ch2 (Triangular)</option>
                    <option value={3}>ch3 (Rectangular)</option>
                </select>
            </div>
            <div>
                <label>Number of Points:</label>
                <input
                    type="range"
                    min="100"
                    max="1000"
                    value={numPoints}
                    onChange={handleNumPointsChange}
                />
                <span>{numPoints}</span>
            </div>
            <div>
                <label>Sampling Rate (Hz):</label>
                <input
                    type="number"
                    min="1"
                    value={samplingRate}
                    onChange={handleSamplingRateChange}
                />
                <span>{samplingRate} Hz</span>
            </div>
        </div>
    );
}

export default Sidebar;