#include "wokwi-api.h"
#include <stdio.h>
#include <stdlib.h>

// Chip state structure
typedef struct {
  pin_t pin_temp_in;
  pin_t pin_heater_out;
  pin_t pin_setpoint_in;
  float current_temp;
  float setpoint;
  float integral;
  float last_error;
  uint32_t last_update_time;
  timer_t timer;
} chip_state_t;

// PID controller parameters
#define KP 2.0
#define KI 0.5
#define KD 1.0
#define UPDATE_INTERVAL_US 1000000  // 1 second

static void chip_timer_callback(void *user_data);

void chip_init(void) {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  
  // Initialize pins
  chip->pin_temp_in = pin_init("TEMP_IN", ANALOG);
  chip->pin_heater_out = pin_init("HEATER_OUT", OUTPUT);
  chip->pin_setpoint_in = pin_init("SETPOINT_IN", ANALOG);
  
  // Initialize state
  chip->current_temp = 36.5;
  chip->setpoint = 37.0;
  chip->integral = 0.0;
  chip->last_error = 0.0;
  chip->last_update_time = 0;
  
  // Read initial setpoint from control
  uint32_t setpoint_attr = attr_init("setpoint", 37.0);
  chip->setpoint = attr_read(setpoint_attr);
  
  // Create timer for periodic updates
  const timer_config_t timer_config = {
    .callback = chip_timer_callback,
    .user_data = chip,
  };
  chip->timer = timer_init(&timer_config);
  timer_start(chip->timer, UPDATE_INTERVAL_US, true);
  
  printf("Temperature Controller initialized. Setpoint: %.1f°C\n", chip->setpoint);
}

static void chip_timer_callback(void *user_data) {
  chip_state_t *chip = (chip_state_t*)user_data;
  
  // Read current temperature from analog input
  uint32_t temp_adc = pin_adc_read(chip->pin_temp_in);
  chip->current_temp = 20.0 + (temp_adc / 4095.0) * 30.0;  // Map 0-4095 to 20-50°C
  
  // Read setpoint from control
  uint32_t setpoint_attr = attr_init("setpoint", 37.0);
  chip->setpoint = attr_read(setpoint_attr);
  
  // PID control algorithm
  float error = chip->setpoint - chip->current_temp;
  chip->integral += error * (UPDATE_INTERVAL_US / 1000000.0);
  
  // Anti-windup
  if (chip->integral > 10.0) chip->integral = 10.0;
  if (chip->integral < -10.0) chip->integral = -10.0;
  
  float derivative = (error - chip->last_error) / (UPDATE_INTERVAL_US / 1000000.0);
  float output = KP * error + KI * chip->integral + KD * derivative;
  chip->last_error = error;
  
  // Control heater output
  bool heater_on = output > 0.5;
  pin_write(chip->pin_heater_out, heater_on ? HIGH : LOW);
  
  printf("Temp: %.1f°C, Setpoint: %.1f°C, Error: %.2f, Heater: %s\n",
         chip->current_temp, chip->setpoint, error, heater_on ? "ON" : "OFF");
}
