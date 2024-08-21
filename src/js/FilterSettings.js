// FilterSettings.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

function FilterSettings({ setAlpha, setFilteringEnabled }) {
  const [alphaValue, setAlphaValue] = useState(0.2);  // Default value
  const [filteringEnabled, setFilteringEnabledLocal] = useState(true);  // Default to enabled
  const navigate = useNavigate();

  const handleSave = () => {
    setAlpha(alphaValue);  // Update the alpha in the parent component
    setFilteringEnabled(filteringEnabled);  // Update filter enabled/disabled state
    navigate('/');  // Navigate back to the main plot view
  };

  return (
    <div className="filter-settings-container">
      <h2>Filter Settings</h2>
      <Form>
        <Form.Group>
          <Form.Label>Alpha (0.01 to 1.0)</Form.Label>
          <Form.Control
            type="range"
            min="0.01"
            max="1.0"
            step="0.01"
            value={alphaValue}
            onChange={(e) => setAlphaValue(parseFloat(e.target.value))}
          />
          <p>Current Alpha: {alphaValue}</p>
        </Form.Group>

        <Form.Group>
          <Form.Label>Enable Filtering</Form.Label>
          <Form.Check
            type="switch"
            label={filteringEnabled ? "On" : "Off"}
            checked={filteringEnabled}
            onChange={() => setFilteringEnabledLocal(!filteringEnabled)}
          />
        </Form.Group>

        <Button variant="primary" onClick={handleSave}>Save Settings</Button>
      </Form>
    </div>
  );
}

export default FilterSettings;
