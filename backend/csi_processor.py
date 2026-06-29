import numpy as np
from scipy.signal import butter, filtfilt
from sklearn.decomposition import PCA

class CSIProcessor:
    def __init__(self, window_size=200):
        self.window_size = window_size
        self.buffer = []
        self.pca = PCA(n_components=2)
        
    def butter_bandpass(self, lowcut, highcut, fs, order=4):
        nyq = 0.5 * fs
        low = lowcut / nyq
        high = highcut / nyq
        b, a = butter(order, [low, high], btype='band')
        return b, a

    def process(self, new_data):
        self.buffer.append(new_data)
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)
            
        if len(self.buffer) < self.window_size:
            return None
            
        data = np.array(self.buffer)
        
        # PCA
        try:
            pca_result = self.pca.fit_transform(data)
            pc1 = pca_result[:, 0]
        except Exception:
            return None
            
        fs = 30.0 # roughly 30Hz packet rate
        
        # Breathing bandpass (0.1 - 0.5 Hz)
        bb, ba = self.butter_bandpass(0.1, 0.5, fs)
        breathing = filtfilt(bb, ba, pc1)
        
        # Heart rate bandpass (0.8 - 2.5 Hz)
        hb, ha = self.butter_bandpass(0.8, 2.5, fs)
        heart = filtfilt(hb, ha, pc1)
        
        # FFT for BPM
        freqs = np.fft.rfftfreq(len(breathing), d=1/fs)
        b_fft = np.abs(np.fft.rfft(breathing))
        h_fft = np.abs(np.fft.rfft(heart))
        
        breathing_rate = freqs[np.argmax(b_fft)] * 60
        heart_rate = freqs[np.argmax(h_fft)] * 60
        
        # Presence based on variance
        variance = np.var(data[-30:], axis=0).mean()
        presence_confidence = min(100.0, max(0.0, variance * 10))
        is_moving = presence_confidence > 60.0
        
        return {
            "breathing_wave": float(breathing[-1]),
            "breathing_rate": float(breathing_rate),
            "heart_rate": float(heart_rate),
            "presence_confidence": float(presence_confidence),
            "is_moving": bool(is_moving)
        }
