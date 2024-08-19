import React, { useState, useEffect } from 'react';

function PlotPeriodogram() {
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Fetch the PSD plot from the FastAPI server
    fetch('/periodogram')
      .then((response) => response.blob())
      .then((imageBlob) => {
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setImageSrc(imageObjectURL);
      })
      .catch((error) => {
        console.error('Error fetching periodogram:', error);
      });
  }, []);

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
