import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Chart({ data, yAxisRange }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid stroke="#444" strokeDasharray="3 3" /> {/* Subtle grid lines */}
                <XAxis dataKey="name" stroke="#f0f0f0" /> {/* Light axis lines */}
                <YAxis domain={[-yAxisRange, yAxisRange]} stroke="#f0f0f0" /> {/* Light axis lines */}
                <Tooltip contentStyle={{ backgroundColor: '#3b3b3b', borderColor: '#555', color: '#f0f0f0' }} 
                         itemStyle={{ color: '#f0f0f0' }} /> {/* Dark tooltip with light text */}
                <Line type="monotone" dataKey="value" stroke="#ff6347" strokeWidth={2} /> {/* Vibrant line color */}
            </LineChart>
        </ResponsiveContainer>
    );
}

export default Chart;