import * as g from 'g.js';

const minMaxValues = {
    0: { min: -1, max: 1 },
    1: { min: -1, max: 1 },
    2: { min: -1, max: 1 },
    3: { min: -1, max: 1 }
};

export const generateFunction = (n, channel) => {
    const f0 = 50; // Fundamental frequency
    const fs = 1e3; // Sampling frequency
    const dt = 1 / fs;
    const t_n = n * dt;
    const { min, max } = minMaxValues[channel] || { min: -1, max: 1 };
    const period = 1 / f0;

    switch (channel) {
        case 1: // Sawtooth
            return g.sawtoothWave(t_n, min, max, period);
        case 2: // Triangular
            return g.triangleWave(t_n, min, max, period);
        case 3: // Rectangular with 50% duty cycle
            return g.squareWave(t_n, min, max, period);
        default: // Sine
            return g.sineWave(t_n, min, max, period);
    }
};