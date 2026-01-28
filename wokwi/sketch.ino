#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

// Pin definitions
#define DHT_PIN 15
#define HEATER_PIN 2
#define FAN_PIN 4
#define BUTTON_PIN 5

// Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// DHT sensor
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

// Display
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Control variables
float temperature = 0.0;
float humidity = 0.0;
float setpoint = 37.0;
bool heaterOn = false;
bool fanOn = false;
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 2000; // Update every 2 seconds

// PID controller
float kp = 2.0;
float ki = 0.5;
float kd = 1.0;
float integral = 0.0;
float lastError = 0.0;

void setup() {
  Serial.begin(115200);
  Serial.println("IncuNest Simulator Starting...");
  
  // Initialize pins
  pinMode(HEATER_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize display
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("IncuNest"));
  display.println(F("Initializing..."));
  display.display();
  delay(2000);
  
  Serial.println("Initialization complete");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors
  if (currentTime - lastUpdate >= updateInterval) {
    lastUpdate = currentTime;
    
    // Read temperature and humidity
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    
    // Check if readings are valid
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      temperature = 36.5;
      humidity = 65.0;
    }
    
    // PID temperature control
    float error = setpoint - temperature;
    integral += error * (updateInterval / 1000.0);
    float derivative = (error - lastError) / (updateInterval / 1000.0);
    float output = kp * error + ki * integral + kd * derivative;
    lastError = error;
    
    // Control heater based on PID output
    heaterOn = output > 0.5;
    digitalWrite(HEATER_PIN, heaterOn ? HIGH : LOW);
    
    // Fan always on for circulation
    fanOn = true;
    digitalWrite(FAN_PIN, fanOn ? HIGH : LOW);
    
    // Update display
    updateDisplay();
    
    // Send data to serial (for integration with web interface)
    sendTelemetry();
  }
  
  // Check button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      // Toggle setpoint (cycle through 35, 36, 37, 38)
      setpoint += 1.0;
      if (setpoint > 38.0) setpoint = 35.0;
      
      Serial.print("Setpoint changed to: ");
      Serial.println(setpoint);
      
      while(digitalRead(BUTTON_PIN) == LOW); // Wait for release
      delay(50);
    }
  }
  
  delay(100);
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.setTextSize(2);
  display.println(F("IncuNest"));
  
  // Temperature
  display.setTextSize(1);
  display.setCursor(0, 20);
  display.print(F("Temp: "));
  display.print(temperature, 1);
  display.println(F(" C"));
  
  // Setpoint
  display.setCursor(0, 30);
  display.print(F("Set:  "));
  display.print(setpoint, 1);
  display.println(F(" C"));
  
  // Humidity
  display.setCursor(0, 40);
  display.print(F("Hum:  "));
  display.print(humidity, 0);
  display.println(F(" %"));
  
  // Status
  display.setCursor(0, 52);
  display.print(F("Heat: "));
  display.print(heaterOn ? "ON " : "OFF");
  display.print(F(" Fan: "));
  display.print(fanOn ? "ON" : "OFF");
  
  display.display();
}

void sendTelemetry() {
  // Send JSON telemetry for web interface
  Serial.print("{\"temp\":");
  Serial.print(temperature);
  Serial.print(",\"humidity\":");
  Serial.print(humidity);
  Serial.print(",\"setpoint\":");
  Serial.print(setpoint);
  Serial.print(",\"heater\":");
  Serial.print(heaterOn ? "true" : "false");
  Serial.print(",\"fan\":");
  Serial.print(fanOn ? "true" : "false");
  Serial.println("}");
}
