import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FunctionGeneratorControl = () => {
  const [frequency, setFrequency] = useState(1000);  // Renamed to frequency
  const [samplingRate, setSamplingRate] = useState(10000);
  const [noise, setNoise] = useState(0.1);
  const [bias, setBias] = useState(0.0);
  const navigate = useNavigate();

  const handleSave = () => {
    const config = {
      frequency: parseInt(frequency, 10) || 0,  // Ensure a default value if input is empty
      samplingRate: parseInt(samplingRate, 10) || 0,
      noise: parseFloat(noise) || 0.0,
      bias: parseFloat(bias) || 0.0,
    };

    console.log('Sending config:', config);  // Log the config object for debugging

    // Post these settings to the FastAPI backend
    fetch('http://localhost:8000/func-gen-ctl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).then(response => response.json())
      .then(data => console.log('Response from backend:', data))
      .catch(error => console.error('Error:', error));
  };

  return (
    <div>
      <h2>Function Generator Control</h2>

      <div>
        <label>Fundamental Frequency (Hz)</label>
        <input
          type="number"
          value={frequency}
          onChange={e => setFrequency(e.target.value)}
        />
      </div>

      <div>
        <label>Sampling Frequency (Hz)</label>
        <input
          type="number"
          value={samplingRate}
          step="1"  // Ensure whole numbers
          onChange={e => setSamplingRate(e.target.value)}
        />
      </div>

      <div>
        <label>Noise Standard Deviation</label>
        <input
          type="number"
          value={noise}
          step="0.1"
          onChange={e => setNoise(e.target.value)}
        />
      </div>

      <div>
        <label>Bias</label>
        <input
          type="number"
          value={bias}
          step="0.1"
          onChange={e => setBias(e.target.value)}
        />
      </div>

      <div>
        <button onClick={handleSave}>Save</button>
        <button onClick={() => navigate('/')}>Back</button>
      </div>
    </div>
  );
};

export default FunctionGeneratorControl;
