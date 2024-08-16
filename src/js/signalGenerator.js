const g = require('g.js');

const minMaxValues = {
    0: { min: -1, max: 1 },
    1: { min: -1, max: 1 },
    2: { min: -1, max: 1 },
    3: { min: -1, max: 1 }
};

const generateFunction = (n, channel, bias = 0, noise=0, samplingRate = 10) => {
    const f0 = 1; // Fundamental frequency
    const dt = 1 / samplingRate; // Dynamic time step based on samplingRate
    const t_n = n * dt;
    const { min, max } = minMaxValues[channel] || { min: -1, max: 1 };
    const period = 1 / f0;

    switch (channel) {
        case 1: // Sawtooth
            return g.sawtoothWave(t_n, min, max, period) + bias + noise;
        case 2: // Triangular
            return g.triangleWave(t_n, min, max, period) + bias + noise;
        case 3: // Rectangular with 50% duty cycle
            return g.squareWave(t_n, min, max, period) + bias + noise;
        default: // Sine
            return g.sineWave(t_n, min, max, period) + bias + noise;
    }
};

module.exports = {
    generateFunction,
    minMaxValues
};
