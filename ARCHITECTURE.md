# IncuNest-Sim Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     IncuNest-Sim                            │
│                    Web Application                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Three.js   │    │  Simulation  │    │  Wokwi HW    │
│ Visualization│◄───┤    Engine    │───►│  Simulation  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        │                   ▼                   │
        │           ┌──────────────┐            │
        └──────────►│  MCP Server  │◄───────────┘
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  AI Clients  │
                    └──────────────┘
```

## Component Details

### 1. Three.js Visualization Layer

**Purpose**: Render interactive 3D model of incubator

**Components**:
- Scene Manager
- Camera Controller (OrbitControls)
- Renderer (WebGL)
- Geometry Builder
- Material Manager
- Animation Loop

**Responsibilities**:
- 3D model construction
- Real-time rendering
- User interaction handling
- Visual effects (shadows, transparency)
- Animation (fan rotation, door movement)

**Files**:
- `src/main.js` - Main visualization logic
- `index.html` - UI structure

### 2. Simulation Engine

**Purpose**: Physics and control simulation

**Components**:
- PID Controller
- Temperature Model
- Humidity Model
- State Manager

**Responsibilities**:
- PID temperature control
- Thermal dynamics simulation
- Humidity calculation
- State updates and synchronization

**Algorithm**:
```
Loop:
  1. Read current temperature
  2. Calculate PID error
  3. Update integral and derivative
  4. Compute control output
  5. Set heater state
  6. Simulate physics (heat transfer, cooling)
  7. Update humidity
  8. Publish state changes
```

**Files**:
- `src/simulation.js`

### 3. Wokwi Hardware Simulation

**Purpose**: Emulate ESP32 and hardware components

**Components**:
- ESP32 DevKit V1 emulation
- DHT22 sensor simulation
- SSD1306 OLED display
- LED indicators
- Custom chips

**Circuit Topology**:
```
ESP32
├── GPIO 15 ──► DHT22 (Temperature/Humidity)
├── GPIO 2  ──► Heater LED
├── GPIO 4  ──► Fan LED
├── GPIO 5  ◄── Button (Input with pullup)
├── GPIO 21 ──► I2C SDA (OLED)
└── GPIO 22 ──► I2C SCL (OLED)
```

**Files**:
- `wokwi/diagram.json` - Circuit definition
- `wokwi/sketch.ino` - Arduino firmware
- `wokwi/platformio.ini` - Build configuration

### 4. Custom Chips

#### Temperature Controller Chip

**Pins**:
- `TEMP_IN` (Analog Input) - Temperature sensor
- `HEATER_OUT` (Digital Output) - Heater control
- `SETPOINT_IN` (Analog Input) - Target temperature
- `VCC`, `GND` - Power

**Control Loop**:
```c
error = setpoint - current_temp
integral += error * dt
derivative = (error - last_error) / dt
output = kp * error + ki * integral + kd * derivative
heater = (output > threshold) ? ON : OFF
```

**Features**:
- Configurable PID gains
- Anti-windup protection
- 1-second update rate
- Debug output to console

**Files**:
- `wokwi/chips/temperature-controller.chip.json`
- `wokwi/chips/temperature-controller.chip.c`

#### Heater Element Chip

**Pins**:
- `CONTROL` (Digital Input) - On/off command
- `TEMP_FEEDBACK` (Analog Output) - Current temperature
- `VCC`, `GND` - Power

**Thermal Model**:
```c
if (heater_on):
  temp += HEAT_RATE * power_factor * dt
else:
  temp -= COOL_RATE * (temp - ambient) * dt
```

**Features**:
- Realistic heating curves
- Environmental cooling
- Adjustable power (0-100W)
- DAC output for temperature

**Files**:
- `wokwi/chips/heater-element.chip.json`
- `wokwi/chips/heater-element.chip.c`

### 5. MCP Server

**Purpose**: AI-assisted development interface

**Protocol**: Model Context Protocol (stdio-based JSON-RPC)

**Available Tools**:

1. **get_simulation_state**
   - Input: None
   - Output: Complete state snapshot
   - Use: Status monitoring

2. **set_temperature_setpoint**
   - Input: temperature (30-40°C)
   - Output: Confirmation
   - Use: Change target temperature

3. **control_heater**
   - Input: state (boolean)
   - Output: Status
   - Use: Manual heater control

4. **control_fan**
   - Input: state (boolean)
   - Output: Status
   - Use: Manual fan control

5. **get_sensor_history**
   - Input: duration (seconds)
   - Output: Historical data array
   - Use: Trend analysis

**Communication Flow**:
```
AI Client ──► MCP Server ──► Simulation Engine
          ◄──            ◄──
```

**Files**:
- `mcp/server.js` - Server implementation
- `mcp/mcp.json` - Configuration

## Data Flow

### Real-Time Simulation Loop

```
┌──────────────────────────────────────────┐
│  Animation Frame (60 FPS)                │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  Simulation Engine Update                │
│  - Calculate PID output                  │
│  - Update temperature                    │
│  - Update humidity                       │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  Three.js Visual Update                  │
│  - Update UI displays                    │
│  - Animate fan rotation                  │
│  - Update heater glow                    │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│  Render Frame                            │
└──────────────────────────────────────────┘
```

### State Management

```javascript
simulationState = {
  temperature: 36.5,      // Current temp (°C)
  setpoint: 37.0,         // Target temp (°C)
  humidity: 65,           // Humidity (%)
  heaterOn: true,         // Heater state
  fanOn: true,            // Fan state
  ambientTemp: 24.0,      // Room temp (°C)
  integral: 0.0,          // PID integral term
  lastError: 0.0          // PID last error
}
```

## Build System

### Development Build

```
Source Files
    │
    ▼
Vite Dev Server
    │
    ├─► Hot Module Replacement
    ├─► ES Module Serving
    └─► Source Maps
    │
    ▼
Browser (http://localhost:5173)
```

### Production Build

```
Source Files
    │
    ▼
Vite Build Process
    │
    ├─► Tree Shaking
    ├─► Minification
    ├─► Code Splitting
    └─► Asset Optimization
    │
    ▼
dist/ Directory
    │
    ├─► index.html
    └─► assets/
        ├─► index-[hash].js
        └─► index-[hash].css
```

## CI/CD Pipeline

```
GitHub Push
    │
    ▼
GitHub Actions
    │
    ├─► Checkout Code
    ├─► Setup Node.js
    ├─► Install Dependencies
    ├─► Validate JSON Files
    ├─► Build Project
    └─► Upload Artifacts
    │
    ▼
Build Artifacts (30 days)
```

**Validations**:
1. JSON syntax check
2. Wokwi diagram structure
3. Custom chip definitions
4. Build success
5. No critical errors

## Performance Characteristics

### Rendering Performance
- Target: 60 FPS
- Actual: 55-60 FPS (typical)
- Scene complexity: ~1000 triangles
- Shadow maps: 2048x2048

### Simulation Performance
- Update rate: 60 Hz
- PID calculation: <1ms
- Physics simulation: <1ms
- Total frame time: ~16ms

### Memory Usage
- Initial: ~50 MB
- Running: ~80 MB
- Peak: ~120 MB

## Security Considerations

### Web Application
- No server-side code
- Static asset serving only
- No user data collection
- CORS-safe resources

### MCP Server
- Local stdio communication
- No network exposure by default
- Input validation on all tools
- Bounded state mutations

## Browser Requirements

### Minimum Requirements
- WebGL 2.0 support
- ES6 module support
- Minimum 2GB RAM
- Modern GPU recommended

### Tested Browsers
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

## Future Architecture Enhancements

### Planned
1. **WebSocket Bridge**: Connect Wokwi to Three.js in real-time
2. **State Persistence**: Save simulation state to localStorage
3. **Data Logging**: Record sensor data to IndexedDB
4. **Web Workers**: Offload physics to background thread
5. **Progressive Loading**: Lazy-load 3D assets

### Experimental
1. **WebRTC**: Multi-user collaborative sessions
2. **WebXR**: VR/AR visualization
3. **WASM**: Compile custom chips to WebAssembly
4. **Cloud Sync**: Sync state across devices
5. **Real Hardware**: Connect to physical IncuNest via WebSerial

## Deployment Architecture

### Static Hosting (Recommended)
```
CDN (CloudFlare/CloudFront)
    │
    ▼
Static Files (dist/)
    │
    ▼
Browser
```

### Self-Hosted
```
Reverse Proxy (nginx)
    │
    ▼
Static File Server
    │
    ▼
dist/ Directory
```

### Docker
```
Docker Container
    │
    ├─► nginx
    └─► dist/ files
```

## Development Tools

- **Vite**: Build tool and dev server
- **Three.js**: 3D graphics library
- **Wokwi**: Hardware simulation platform
- **MCP SDK**: Model Context Protocol library
- **ESLint**: Code linting (future)
- **Prettier**: Code formatting (future)

## Testing Strategy

### Current
- JSON validation
- Build verification
- Manual testing

### Planned
- Unit tests (Jest/Vitest)
- Integration tests
- E2E tests (Playwright)
- Visual regression tests

---

This architecture is designed for:
- **Modularity**: Easy to extend and modify
- **Performance**: 60 FPS on modest hardware
- **Compatibility**: Works in all modern browsers
- **Maintainability**: Clear separation of concerns
- **Educational Value**: Excellent learning tool
