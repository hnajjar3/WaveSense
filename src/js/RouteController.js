import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignalPlotter from './SignalPlotter';
import PlotPeriodogram from './PlotPeriodogram';  // Import the PSD plotting component
import FunctionGeneratorControl from './FunctionGeneratorControl';
import FilterSettings from './FilterSettings';
import { DarkModeToggle } from './DarkModeToggle';

function RouteController() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [alpha, setAlpha] = useState(0.2);  // Default alpha value
  const [filteringEnabled, setFilteringEnabled] = useState(true);  // Default filtering value
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    // Load config.json from the server or public folder
    fetch('/config.json')  // Assuming the config file is in public folder
      .then((response) => response.json())
      .then((config) => {
        setAlpha(config.alpha);  // Set alpha from config
        setFilteringEnabled(config.filter.enable);  // Set filteringEnabled from config
        setConfigLoaded(true);  // Indicate that the config has been loaded
      })
      .catch((error) => {
        console.error('Error loading config:', error);
        // Optionally, handle error or set fallback values
      });
  }, []);

  // Prevent rendering until the config is loaded
  if (!configLoaded) {
    return <div>Loading configuration...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Route for the Periodogram Plot */}
        <Route path="/periodogram" element={<PlotPeriodogram />} />

        {/* Route for the Function Generator Control */}
        <Route path="/func-gen-ctl" element={<FunctionGeneratorControl />} />

        {/* Route for the Savitzky-Golay Filter Settings */}
        <Route path="/sav-golay-filt" element={<SavitzkyGolayFilterView />} />

        {/* Default route for the Signal Plotter */}
        {/* Pass isDarkMode, alpha, and filteringEnabled as props */}
        <Route
          path="/"
          element={
            <SignalPlotter
              isDarkMode={isDarkMode}
              alpha={alpha}
              filteringEnabled={filteringEnabled}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default RouteController;
