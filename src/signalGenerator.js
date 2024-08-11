const g = require('g.js');

const minMaxValues = {
    0: { min: -1, max: 1 },
    1: { min: -1, max: 1 },
    2: { min: -1, max: 1 },
    3: { min: -1, max: 1 }
};

const generateFunction = (n, channel, offset = 0, samplingRate = 10) => {
    const f0 = 1; // Fundamental frequency
    const dt = 1 / samplingRate; // Dynamic time step based on samplingRate
    const t_n = n * dt;
    const { min, max } = minMaxValues[channel] || { min: -1, max: 1 };
    const period = 1 / f0;

    switch (channel) {
        case 1: // Sawtooth
            return g.sawtoothWave(t_n, min, max, period) + offset;
        case 2: // Triangular
            return g.triangleWave(t_n, min, max, period) + offset;
        case 3: // Rectangular with 50% duty cycle
            return g.squareWave(t_n, min, max, period) + offset;
        default: // Sine
            return g.sineWave(t_n, min, max, period) + offset;
    }
};

module.exports = {
    generateFunction,
    minMaxValues
};