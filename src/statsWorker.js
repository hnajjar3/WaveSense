/* eslint-disable no-restricted-globals */

let collectedData = [];

self.onmessage = function (e) {
    if (e.data.action === 'start') {
        console.log('Stats worker started');
        collectedData = []; // Clear previous data if any
    } else if (e.data.action === 'process') {
        let { n, signal } = e.data;
        collectedData.push({ n, voltage: signal });

        // If 1 second worth of data has been collected, calculate stats
        if (collectedData.length >= 100) { // Assuming 100 samples per second
            const voltages = collectedData.map(d => d.voltage * 1000);

            const max = Math.max(...voltages);
            const min = Math.min(...voltages);
            const mean = voltages.reduce((acc, v) => acc + v, 0) / voltages.length;
            const rms = Math.sqrt(voltages.reduce((acc, v) => acc + v * v, 0) / voltages.length);

            self.postMessage({
                max: max.toFixed(2) + ' mV',
                min: min.toFixed(2) + ' mV',
                mean: mean.toFixed(2) + ' mV',
                rms: rms.toFixed(2) + ' mV',
                // deltaX: (1000 / collectedData.length).toFixed(2) + ' ms',
                // deltaY: ((max - min) / 10).toFixed(2) + ' mV'
            });

            collectedData = []; // Clear data for the next second
        }
    }
};
