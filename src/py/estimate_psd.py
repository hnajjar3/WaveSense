import os
import numpy as np
import matplotlib.pyplot as plt

def plot_psd():
    try:
        data_file = 'src/py/data/psd/signal.csv'
        if not os.path.exists(data_file):
            print(os.getcwd())
            print("Data file not found")
            return

        # Skip the first row (header) using skiprows=1
        data = np.loadtxt(data_file, delimiter=',', skiprows=1)

        time = data[:, 0]
        signal = data[:, 1]

        # Calculate the sampling frequency
        fs = 1 / (time[1] - time[0])
        fs = 44000

        # Compute the Power Spectral Density (PSD) using Welch's method
        plt.figure()
        plt.psd(signal, NFFT=512, Fs=fs)
        plt.xlabel('Frequency (Hz)')
        plt.ylabel('Power Spectral Density (V^2/Hz)')
        plt.title('PSD of the Signal (Welch Method)')
        plt.show()

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    plot_psd()
