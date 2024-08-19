# periodogram.py
import numpy as np
import matplotlib.pyplot as plt
from io import BytesIO

NFFT = 2**10

def estimate_psd(time, signal, sampling_rate):
    # Remove the DC component by subtracting the mean of the signal
    signal = signal - np.mean(signal)

    # Calculate the sampling frequency
    fs = sampling_rate

    # Compute the Power Spectral Density (PSD) using Welch's method
    fig, ax = plt.subplots()
    ax.psd(signal, NFFT=NFFT, Fs=fs)
    ax.set_xlabel('Frequency (Hz)')
    ax.set_ylabel('Power Spectral Density (V^2/Hz)')
    ax.set_title('Periodogram of the Signal (Welch Method)')

    # Save the plot to a BytesIO object
    buf = BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)

    return buf
