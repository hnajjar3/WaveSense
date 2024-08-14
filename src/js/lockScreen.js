import React from 'react';
import '../css/LockScreen.css';

const LockScreen = ({ onUnlock }) => {
    return (
            <div className="lock-screen">
            <div className="lock-screen-content">
            <h1>Screen Locked</h1>
            <button onClick={onUnlock}>Unlock</button>
            </div>
            </div>
    );
};

export default LockScreen;
