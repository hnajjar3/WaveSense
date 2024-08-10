import React, { useState } from 'react';

function Sidebar({ onChange }) {
    const [yAxisRange, setYAxisRange] = useState(10);
    const [yOffset, setYOffset] = useState(0);
    const [channel, setChannel] = useState(0);

    const handleYAxisRangeChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setYAxisRange(value);
        onChange({ yAxisRange: value, yOffset, channel });
    };

    const handleYOffsetChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setYOffset(value);
        onChange({ yAxisRange, yOffset: value, channel });
    };

    const handleChannelChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setChannel(value);
        onChange({ yAxisRange, yOffset, channel: value });
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
        </div>
    );
}

export default Sidebar;