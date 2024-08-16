# print data on OLED display ever 100ms
import uasyncio as asyncio
from machine import ADC, Pin, I2C
import ssd1306

# Initialize the ADC and OLED
adc = ADC(Pin(26))  # Use a single ADC pin for voltage reading
i2c = I2C(0, scl=Pin(5), sda=Pin(4))
oled = ssd1306.SSD1306_I2C(128, 32, i2c)  # Initialize OLED display

# Configuration
V_REF = 3.3
ADC_BITS = 12
ADC_MAX = (1 << ADC_BITS) - 1
VOLTAGE_DIVIDER_RATIO = 5.06
OLED_UPDATE_INTERVAL = 0.1  # 100ms for OLED update
VR_OFFSET = 0.55

async def read_adc():
    """Read and convert the ADC value to a voltage."""
    while True:
        raw_value = adc.read_u16()  # Read raw ADC value
        scaled_value = raw_value >> 4  # Scale down the 16-bit value to 12 bits
        voltage = scaled_value * V_REF / ADC_MAX  # Convert to voltage
        actual_voltage = voltage * VOLTAGE_DIVIDER_RATIO + VR_OFFSET  # Adjust for voltage divider
        return actual_voltage

async def oled_task():
    """Update the OLED with the voltage every 100ms."""
    while True:
        voltage = await read_adc()
        voltage_str = "{:.2f}V".format(voltage)  # Convert voltage to string with 2 decimal places
        oled.fill(0)  # Clear the display
        oled.text(f'Voltage:', 0, 0)  # Display label
        oled.text(voltage_str, 0, 10)  # Display the voltage value as a string
        oled.show()  # Refresh the display
        await asyncio.sleep(OLED_UPDATE_INTERVAL)

async def main():
    # Display the voltage continuously on the OLED
    await oled_task()

try:
    asyncio.run(main())
except KeyboardInterrupt:
    print('Program stopped')