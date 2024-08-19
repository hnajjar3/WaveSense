from microdot import Microdot
from microdot.websocket import with_websocket
import uasyncio as asyncio
from machine import ADC, Pin, I2C
import ssd1306
import json
from time import sleep

# Initialize the ADC and OLED
adc = ADC(Pin(26))  # Use a single ADC pin for voltage reading
i2c = I2C(0, scl=Pin(5), sda=Pin(4))
oled = ssd1306.SSD1306_I2C(128, 32, i2c)  # Initialize OLED display

oled.text('Starting microcontroller', 0, 10)  # Display the voltage value as a string
oled.show()
sleep(1)  # Wait for 1 second before clearing the screen

# Configuration
V_REF = 3.3
ADC_BITS = 12
ADC_MAX = (1 << ADC_BITS) - 1
VOLTAGE_DIVIDER_RATIO = 5.06
OFFSET = -0.07
SAMPLING_RATE = 44000  # Hz for WebSocket transmission
OLED_UPDATE_INTERVAL = 0.1  # 100ms for OLED update

app = Microdot()

async def read_adc(n):
    """Read and convert the ADC value to a voltage, returning sample number and voltage."""
    raw_value = adc.read_u16()  # Read raw ADC value
    scaled_value = raw_value >> 4  # Scale down the 16-bit value to 12 bits
    voltage = scaled_value * V_REF / ADC_MAX  # Convert to voltage
    actual_voltage = voltage * VOLTAGE_DIVIDER_RATIO + OFFSET  # Adjust for voltage divider
    return n, actual_voltage

async def oled_task():
    """Update the OLED with the voltage every 100ms."""
    n = 0  # Initialize the sample counter
    while True:
        n, voltage = await read_adc(n)  # Read sample number and voltage
        voltage_str = "{:.2f}V".format(voltage)  # Convert voltage to string with 2 decimal places
        oled.fill(0)  # Clear the display
        oled.text(f'Sample Num: {n}', 0, 0)  # Display sample number
        oled.text(f'Voltage: {voltage_str}', 0, 10)  # Display the voltage value as a string
        oled.show()  # Refresh the display
        await asyncio.sleep(OLED_UPDATE_INTERVAL)
        n += 1  # Increment the sample counter

@app.route('/ws')
@with_websocket
async def websocket(request, ws):
    """Handle WebSocket communication."""
    n = 0  # Initialize the sample counter
    while True:
        n, voltage = await read_adc(n)  # Read sample number and voltage
        data = json.dumps({'n': n, 'signal': voltage})  # Send both n and voltage
        await ws.send(data)
        await asyncio.sleep(1 / SAMPLING_RATE)
        n += 1  # Increment the sample counter

async def main():
    # Start the OLED display task
    asyncio.create_task(oled_task())
    
    # Start the WebSocket server
    await app.start_server(port=80)

try:
    asyncio.run(main())
except KeyboardInterrupt:
    print('Server stopped')
