# IncuNest Simulator - Technical Documentation

## Architecture Overview

### System Components

The IncuNest Simulator consists of three main layers:

1. **Visualization Layer (Three.js)**
   - 3D rendering of the incubator
   - Interactive controls
   - Real-time data display

2. **Simulation Layer (Wokwi)**
   - ESP32 microcontroller simulation
   - Sensor and actuator emulation
   - Custom hardware chips

3. **Integration Layer (MCP)**
   - API for external tools
   - State management
   - Data persistence

## Three.js Visualization

### Scene Setup

```javascript
// Camera setup
camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
camera.position.set(15, 12, 15);

// Renderer with shadows
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
```

### Components

#### Incubator Structure
- **Base**: Platform supporting the entire assembly
- **Chamber**: Transparent enclosure with physical properties
- **Door**: Animated access panel
- **Mattress**: Support surface for the infant

#### Hardware Elements
- **Heater**: Cylindrical heating element with emissive material
- **Fan**: Rotating blades for air circulation
- **Sensors**: Visual representations of DHT22 and other sensors
- **Control Panel**: Display screen and controls

### Lighting System

Three light sources provide realistic illumination:
1. **Ambient Light**: Base illumination (50% intensity)
2. **Directional Light**: Main light with shadows
3. **Fill Light**: Secondary light for balance

## Simulation Engine

### Temperature Control (PID)

The simulation uses a PID (Proportional-Integral-Derivative) controller:

```javascript
error = setpoint - temperature
integral += error * dt
derivative = (error - lastError) / dt
output = kp * error + ki * integral + kd * derivative
```

#### Parameters
- `kp = 0.5`: Proportional gain (immediate response)
- `ki = 0.01`: Integral gain (eliminates steady-state error)
- `kd = 0.1`: Derivative gain (reduces overshoot)

### Physics Simulation

#### Heat Transfer
- **Heater Input**: 0.01°C/s when active
- **Environmental Loss**: Proportional to temperature difference
- **Fan Effect**: Improves heat distribution

#### Humidity Model
- Increases with heater activity (evaporation)
- Decreases when heater is off
- Clamped between 40-85%

## Wokwi Hardware Simulation

### Circuit Design

#### ESP32 Connections
- **GPIO 15**: DHT22 sensor (temperature/humidity)
- **GPIO 2**: Heater control LED
- **GPIO 4**: Fan control LED
- **GPIO 5**: User button input
- **GPIO 21/22**: I2C for OLED display

#### Power Distribution
- 3.3V rail for sensors and display
- Common ground for all components
- 220Ω current-limiting resistors for LEDs

### Firmware Logic

The Arduino sketch implements:
1. **Sensor Reading**: 2-second update interval
2. **PID Control**: Automatic temperature regulation
3. **Display Update**: Real-time status on OLED
4. **Serial Output**: JSON telemetry for web interface

### Custom Chips

#### Temperature Controller Chip

**Purpose**: Advanced PID control with adjustable parameters

**Pins**:
- `TEMP_IN`: Analog temperature input
- `HEATER_OUT`: Digital heater control
- `SETPOINT_IN`: Analog setpoint input

**Features**:
- Configurable PID parameters
- Anti-windup protection
- Real-time performance monitoring

**Implementation**: `wokwi/chips/temperature-controller.chip.c`

#### Heater Element Chip

**Purpose**: Thermal dynamics simulation

**Pins**:
- `CONTROL`: Digital on/off control
- `TEMP_FEEDBACK`: Analog temperature output

**Features**:
- Realistic heating curves
- Environmental cooling
- Adjustable power rating

**Implementation**: `wokwi/chips/heater-element.chip.c`

## Model Context Protocol (MCP)

### Server Architecture

The MCP server provides a standardized interface for AI tools to interact with the simulation.

### Tool Definitions

#### get_simulation_state
Returns current state snapshot:
```json
{
  "temperature": 36.5,
  "humidity": 65,
  "setpoint": 37.0,
  "heaterOn": true,
  "fanOn": true,
  "timestamp": "2026-01-28T21:00:00.000Z"
}
```

#### set_temperature_setpoint
Updates target temperature:
- Input: temperature (30-40°C)
- Output: Confirmation message
- Side effect: Updates simulation state

#### control_heater / control_fan
Toggle hardware components:
- Input: boolean state
- Output: Status confirmation
- Side effect: Immediate hardware control

#### get_sensor_history
Retrieves historical data:
- Input: duration (seconds)
- Output: Array of timestamped readings
- Use case: Trend analysis, diagnostics

### Integration

To use the MCP server with AI assistants:

1. Start the server: `npm run mcp`
2. Configure your AI tool with the server endpoint
3. Use natural language to control the simulation

Example commands:
- "Show me the current temperature"
- "Set the temperature to 38 degrees"
- "Turn off the heater"
- "Get the last hour of sensor data"

## CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/wokwi-ci.yml` file defines automated tests:

#### Build Stage
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build production assets

#### Validation Stage
1. **JSON Validation**: Verify all configuration files
2. **Circuit Validation**: Check Wokwi diagram structure
3. **Chip Validation**: Validate custom chip definitions
4. **Build Verification**: Ensure production build succeeds

#### Artifact Upload
- Build artifacts stored for 30 days
- Available for deployment or review

### Running Tests Locally

```bash
# Validate all JSON files
find . -name "*.json" -exec python3 -m json.tool {} \;

# Check Wokwi diagram
cat wokwi/diagram.json | python3 -m json.tool

# Validate custom chips
for chip in wokwi/chips/*.chip.json; do
  echo "Validating $chip"
  cat "$chip" | python3 -m json.tool
done
```

## Performance Optimization

### Three.js Optimizations
- Shadow map resolution: 2048x2048
- Frustum culling enabled
- Anti-aliasing with acceptable performance
- Damped camera controls

### Simulation Optimizations
- 60 FPS rendering loop
- Physics updates at fixed intervals
- Minimal state recalculation
- Efficient material reuse

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Required Features
- WebGL 2.0
- ES6 modules
- Web Workers (future enhancement)

## Future Enhancements

### Planned Features
1. **WebSocket Integration**: Real-time sync between Wokwi and Three.js
2. **Data Logging**: Persistent storage of sensor readings
3. **Multi-user Collaboration**: Shared simulation sessions
4. **VR Support**: Immersive visualization with WebXR
5. **Advanced Sensors**: Oxygen level, weight monitoring
6. **Alarm System**: Visual and audio alerts for critical conditions

### Experimental Features
- **Machine Learning**: Predictive temperature control
- **Digital Twin**: Integration with real hardware
- **Cloud Deployment**: Hosted simulation instances

## Troubleshooting

### Common Issues

#### "Cannot find module 'three'"
```bash
npm install
```

#### "Wokwi simulation not starting"
- Check `diagram.json` for syntax errors
- Verify all pin connections
- Ensure libraries are available

#### "MCP server not responding"
```bash
# Check Node.js version
node --version  # Should be 18+

# Test server directly
node mcp/server.js
```

#### "Build fails"
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development Guidelines

### Code Style
- ES6+ JavaScript
- Functional components where possible
- Clear variable names
- Comments for complex logic

### Git Workflow
1. Create feature branch from `main`
2. Make focused, atomic commits
3. Write descriptive commit messages
4. Submit PR with clear description

### Testing Checklist
- [ ] Visual inspection of 3D model
- [ ] Verify all controls work
- [ ] Check sensor data updates
- [ ] Test in multiple browsers
- [ ] Validate Wokwi simulation
- [ ] Run CI/CD pipeline

## Resources

### Documentation
- [Three.js Docs](https://threejs.org/docs/)
- [Wokwi Documentation](https://docs.wokwi.com/)
- [MCP Specification](https://modelcontextprotocol.io/)

### Learning Resources
- Three.js Journey: https://threejs-journey.com/
- Wokwi Academy: https://wokwi.com/academy
- ESP32 Reference: https://docs.espressif.com/

### Community
- IncuNest Discord: [Link TBD]
- GitHub Discussions: [Link to repo]
- Medical Open World: https://medicalopenworld.org

## Contributors

This project is developed and maintained by Medical Open World and community contributors.

**Lead Developer**: Pablo Sánchez Bergasa  
**Organization**: Medical Open World  
**Contact**: contact@medicalopenworld.org

---

For questions or support, please open an issue on GitHub or contact us at contact@medicalopenworld.org
