from machine import Pin, I2C
import ssd1306

# Initialize I2C with SDA on GP4 and SCL on GP5
i2c = I2C(0, scl=Pin(5), sda=Pin(4))

# Initialize the OLED display (128x32 pixels) at I2C address 0x3C
oled = ssd1306.SSD1306_I2C(128, 32, i2c, addr=0x3C)

# Clear the display
oled.fill(0)

# Display some text
oled.text('Hello, Pico W!', 0, 0)
oled.text('I2C OLED Test', 0, 10)

# Update the display
oled.show()