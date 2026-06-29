import socket
import time
import math
import struct
import random

UDP_IP = "127.0.0.1"
UDP_PORT = 8765

print("Starting Mock CSI Simulator...")
print(f"Targeting UDP {UDP_IP}:{UDP_PORT}")

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Simulate 64 subcarriers (128 bytes of I/Q data)
t = 0.0
dt = 1.0 / 30.0 # 30 Hz

while True:
    # 0xCF magic byte + RSSI (-60) + MAC (6 bytes) + len (0x00, 0x80) -> 128 bytes
    packet = bytearray([0xCF, 256-60, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00, 128])
    
    # Generate mock I/Q data
    # Breathing wave ~ 0.3 Hz (18 BPM)
    breathing = math.sin(2 * math.pi * 0.3 * t) * 5
    # Heart wave ~ 1.2 Hz (72 BPM)
    heart = math.sin(2 * math.pi * 1.2 * t) * 1.5
    
    # Introduce random motion spikes every 10 seconds
    motion = 0
    if int(t) % 10 == 0 and int(t * 10) % 10 < 2:
        motion = random.uniform(-40, 40)
        
    for i in range(64):
        # Base amplitude depends on subcarrier index roughly
        base_amp = 30 + math.sin(i * 0.1) * 10
        
        # Subcarriers 10-30 are highly sensitive to breathing
        sens = 1.0 if 10 <= i <= 30 else 0.2
        
        amp = base_amp + (breathing + heart + motion) * sens + random.uniform(-2, 2)
        
        # Split amplitude arbitrarily into I and Q
        angle = random.uniform(0, 2*math.pi)
        I = int(amp * math.cos(angle))
        Q = int(amp * math.sin(angle))
        
        # clamp to -128, 127
        I = max(-128, min(127, I))
        Q = max(-128, min(127, Q))
        
        if I < 0: I += 256
        if Q < 0: Q += 256
        
        packet.append(I)
        packet.append(Q)
        
    sock.sendto(packet, (UDP_IP, UDP_PORT))
    t += dt
    time.sleep(dt)
