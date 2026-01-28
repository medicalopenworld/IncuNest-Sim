/**
 * SimulationEngine - Simulates incubator hardware behavior
 * This connects to the Wokwi simulation and provides realistic sensor data
 */
export class SimulationEngine {
    constructor() {
        this.temperature = 36.5; // Current temperature in Celsius
        this.setpoint = 37.0; // Target temperature
        this.humidity = 65; // Current humidity percentage
        this.heaterOn = true;
        this.fanOn = true;
        this.ambientTemp = 24; // Room temperature
        this.lastUpdate = Date.now();
        
        // PID controller parameters
        this.kp = 0.5; // Proportional gain
        this.ki = 0.01; // Integral gain
        this.kd = 0.1; // Derivative gain
        this.integral = 0;
        this.lastError = 0;
    }
    
    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000; // Delta time in seconds
        this.lastUpdate = now;
        
        // PID temperature control
        const error = this.setpoint - this.temperature;
        this.integral += error * dt;
        const derivative = (error - this.lastError) / dt;
        const output = this.kp * error + this.ki * this.integral + this.kd * derivative;
        this.lastError = error;
        
        // Turn heater on/off based on PID output
        this.heaterOn = output > 0.1;
        
        // Temperature physics simulation
        if (this.heaterOn) {
            // Heater adds heat
            this.temperature += 0.01 * dt;
        }
        
        // Heat loss to environment
        const heatLoss = (this.temperature - this.ambientTemp) * 0.002 * dt;
        this.temperature -= heatLoss;
        
        // Fan circulation effect (stabilizes temperature)
        if (this.fanOn) {
            const targetTemp = this.heaterOn ? this.setpoint : this.ambientTemp;
            this.temperature += (targetTemp - this.temperature) * 0.005 * dt;
        }
        
        // Humidity simulation (simplified)
        // Humidity increases when heater is on (evaporation from water reservoir)
        if (this.heaterOn) {
            this.humidity += 0.1 * dt;
            this.humidity = Math.min(this.humidity, 85); // Max 85%
        } else {
            this.humidity -= 0.05 * dt;
            this.humidity = Math.max(this.humidity, 40); // Min 40%
        }
        
        // Clamp temperature to realistic range
        this.temperature = Math.max(25, Math.min(40, this.temperature));
    }
    
    toggleHeater() {
        this.heaterOn = !this.heaterOn;
    }
    
    toggleFan() {
        this.fanOn = !this.fanOn;
    }
    
    setTemperatureSetpoint(temp) {
        this.setpoint = Math.max(30, Math.min(40, temp));
    }
    
    reset() {
        this.temperature = 36.5;
        this.setpoint = 37.0;
        this.humidity = 65;
        this.heaterOn = true;
        this.fanOn = true;
        this.integral = 0;
        this.lastError = 0;
    }
    
    getData() {
        return {
            temperature: this.temperature,
            setpoint: this.setpoint,
            humidity: this.humidity,
            heaterOn: this.heaterOn,
            fanOn: this.fanOn,
            ambientTemp: this.ambientTemp
        };
    }
    
    // Interface for Wokwi integration
    setFromWokwi(data) {
        if (data.temperature !== undefined) this.temperature = data.temperature;
        if (data.humidity !== undefined) this.humidity = data.humidity;
        if (data.heaterOn !== undefined) this.heaterOn = data.heaterOn;
        if (data.fanOn !== undefined) this.fanOn = data.fanOn;
    }
}
