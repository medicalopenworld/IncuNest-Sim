#include "wokwi-api.h"
#include <stdio.h>
#include <stdlib.h>

typedef struct {
  pin_t pin_control;
  pin_t pin_temp_feedback;
  float temperature;
  float power_watts;
  bool is_on;
  timer_t timer;
  uint32_t framebuffer;
} chip_state_t;

#define UPDATE_INTERVAL_US 500000  // 0.5 seconds
#define AMBIENT_TEMP 24.0
#define HEAT_RATE 0.5  // degrees per second when on
#define COOL_RATE 0.1  // degrees per second when off

static void chip_timer_callback(void *user_data);
static void on_control_change(void *user_data, pin_t pin, uint32_t value);

void chip_init(void) {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  
  // Initialize pins
  chip->pin_control = pin_init("CONTROL", INPUT);
  chip->pin_temp_feedback = pin_init("TEMP_FEEDBACK", ANALOG);
  
  // Initialize state
  chip->temperature = AMBIENT_TEMP;
  chip->is_on = false;
  
  // Read power setting from control
  uint32_t power_attr = attr_init("power", 50.0);
  chip->power_watts = attr_read(power_attr);
  
  // Watch for control pin changes
  const pin_watch_config_t watch_config = {
    .edge = BOTH,
    .pin_change = on_control_change,
    .user_data = chip,
  };
  pin_watch(chip->pin_control, &watch_config);
  
  // Create timer for temperature simulation
  const timer_config_t timer_config = {
    .callback = chip_timer_callback,
    .user_data = chip,
  };
  chip->timer = timer_init(&timer_config);
  timer_start(chip->timer, UPDATE_INTERVAL_US, true);
  
  printf("Heater Element initialized. Power: %.0fW\n", chip->power_watts);
}

static void on_control_change(void *user_data, pin_t pin, uint32_t value) {
  chip_state_t *chip = (chip_state_t*)user_data;
  chip->is_on = (value == HIGH);
  printf("Heater %s\n", chip->is_on ? "ON" : "OFF");
}

static void chip_timer_callback(void *user_data) {
  chip_state_t *chip = (chip_state_t*)user_data;
  
  float dt = UPDATE_INTERVAL_US / 1000000.0;  // seconds
  
  // Update temperature based on heater state
  if (chip->is_on) {
    // Heating
    float heat_rate = HEAT_RATE * (chip->power_watts / 50.0);
    chip->temperature += heat_rate * dt;
    if (chip->temperature > 50.0) chip->temperature = 50.0;  // Max temp
  } else {
    // Cooling to ambient
    float temp_diff = chip->temperature - AMBIENT_TEMP;
    chip->temperature -= COOL_RATE * temp_diff * dt;
  }
  
  // Output temperature as analog voltage (map 20-50°C to 0-4095)
  float normalized = (chip->temperature - 20.0) / 30.0;
  if (normalized < 0.0) normalized = 0.0;
  if (normalized > 1.0) normalized = 1.0;
  uint32_t dac_value = (uint32_t)(normalized * 4095.0);
  pin_dac_write(chip->pin_temp_feedback, dac_value);
  
  // Update display (simple temperature indicator)
  if (chip->framebuffer == 0) {
    chip->framebuffer = framebuffer_init(48, 24);
  }
  
  printf("Heater temp: %.1f°C (target ~37°C)\n", chip->temperature);
}
