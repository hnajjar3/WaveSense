import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PlotPeriodogram() {
  const [imageSrc, setImageSrc] = useState(null);
  const location = useLocation();  // To receive the passed state (samplingRate)
  const samplingRate = location.state?.samplingRate || 1000; // Default sampling rate if not provided

  useEffect(() => {
    // Fetch the PSD plot from the FastAPI server and include the sampling rate
    fetch(`/periodogram?samplingRate=${samplingRate}`)
      .then((response) => response.blob())
      .then((imageBlob) => {
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setImageSrc(imageObjectURL);
      })
      .catch((error) => {
        console.error('Error fetching periodogram:', error);
      });
  }, [samplingRate]);

  return (
    <div>
      <h1>Periodogram</h1>
      {imageSrc ? (
        <img src={imageSrc} alt="Periodogram" style={{ maxWidth: '100%' }} />
      ) : (
        <p>Loading periodogram...</p>
      )}
    </div>
  );
}

export default PlotPeriodogram;
