import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignalPlotter from './SignalPlotter';
import PlotPeriodogram from './PlotPeriodogram';  // Import the PSD plotting component
import FunctionGeneratorControl from './FunctionGeneratorControl';


function RouteController() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignalPlotter />} />
        <Route path="/periodogram" element={<PlotPeriodogram />} />  {/* Use element here */}
        <Route path="/func-gen-ctl" element={<FunctionGeneratorControl />} />  {/* Updated here */}
      </Routes>
    </Router>
  );
}

export default RouteController;
