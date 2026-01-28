# IncuNest Simulator - Quick Start Guide

## What is IncuNest-Sim?

IncuNest-Sim is a comprehensive web-based simulator for the IncuNest open-source neonatal incubator. It combines:

- **3D Visualization** using Three.js for interactive exploration
- **Hardware Simulation** using Wokwi for ESP32 and sensors
- **Custom Chips** for specialized hardware behavior
- **MCP Server** for AI-assisted development

## Installation

```bash
# Clone the repository
git clone https://github.com/medicalopenworld/IncuNest-Sim.git
cd IncuNest-Sim

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173`

## Features Overview

### 1. 3D Interactive Visualization

The main viewport shows a realistic 3D model of the incubator:

- **Transparent chamber** - See inside the incubator
- **Mattress** - Blue support surface
- **Heater element** - Glows red when active
- **Fan with rotating blades** - Visible circulation
- **Sensors** - Temperature and humidity monitoring
- **Control panel** - Display and controls

**Controls:**
- **Click and drag** - Rotate the view
- **Scroll** - Zoom in/out
- **Buttons** - Interact with the simulation

### 2. Real-Time Sensor Data

Left panel displays live information:

- **Temperature Control**
  - Current internal temperature
  - Target setpoint
- **Humidity**
  - Current humidity percentage
- **System Status**
  - Heater ON/OFF state
  - Fan ON/OFF state

### 3. Hardware Simulation (Wokwi)

Right panel shows hardware status:

- **ESP32**: Microcontroller simulation running
- **Sensors**: DHT22 temperature/humidity active
- **Custom Chips**: Specialized hardware loaded

### 4. Interactive Controls

Bottom panel provides three buttons:

1. **Open/Close Door** - Animates door movement
2. **Toggle Heater** - Manual heater control
3. **Reset Simulation** - Return to initial state

## How It Works

### Temperature Control

The simulator uses a PID (Proportional-Integral-Derivative) controller:

1. Measures current temperature
2. Compares to setpoint (default 37°C)
3. Calculates required heater output
4. Adjusts heater on/off state
5. Simulates thermal dynamics

### Humidity Simulation

- Increases when heater is active (evaporation)
- Decreases when heater is off
- Maintains realistic range (40-85%)

### Physics Engine

Simulates real-world behavior:

- Heat transfer from heater
- Environmental cooling
- Air circulation effects
- Thermal mass and inertia

## Advanced Usage

### Wokwi Hardware Simulation

To run the full Wokwi simulation:

1. Visit [https://wokwi.com](https://wokwi.com)
2. Create a new project
3. Upload files from `wokwi/` directory:
   - `diagram.json` - Circuit diagram
   - `sketch.ino` - Arduino code
   - Custom chips from `wokwi/chips/`
4. Click "Start Simulation"

### Custom Chips

Two custom chips are included:

#### Temperature Controller Chip
- Advanced PID control
- Configurable parameters
- Anti-windup protection
- Real-time monitoring

#### Heater Element Chip
- Realistic thermal simulation
- Heating and cooling curves
- Adjustable power rating
- Temperature feedback

### MCP Server

For AI-assisted development:

```bash
# Start MCP server
npm run mcp
```

Configure your AI tool to connect to the MCP server for:
- Reading simulation state
- Controlling temperature
- Toggling hardware
- Accessing sensor history

## Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Build output is in the `dist/` directory.

## Deployment Options

### Static Hosting
Deploy to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

### Self-Hosted
- Any web server (nginx, Apache)
- Docker container
- Node.js server with `npm run preview`

## Integration with Real Hardware

The simulator is designed to mirror real IncuNest hardware:

1. **Firmware Compatibility**: Arduino sketch matches real firmware structure
2. **Sensor Mapping**: DHT22, buttons, displays match physical connections
3. **Control Logic**: PID parameters tuned for actual hardware
4. **Testing Platform**: Validate algorithms before hardware deployment

## Development Workflow

### For Contributors

1. **Test in Simulator**: Validate changes quickly
2. **Verify in Wokwi**: Check hardware compatibility
3. **Deploy to Hardware**: Flash to real ESP32
4. **Monitor Results**: Compare behavior

### For Education

1. **Learn PID Control**: Interactive visualization of control theory
2. **Understand Sensors**: See how DHT22 works
3. **Practice ESP32**: Program without hardware
4. **Explore 3D Graphics**: Learn Three.js

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails
```bash
npm run build -- --debug
```

### Browser compatibility issues
- Use Chrome/Edge 90+
- Enable WebGL 2.0
- Update graphics drivers

### Performance issues
- Reduce shadow quality in `src/main.js`
- Disable anti-aliasing
- Close other tabs

## Resources

- **IncuNest Main Project**: [github.com/medicalopenworld/IncuNest](https://github.com/medicalopenworld/IncuNest)
- **Documentation**: [github.com/medicalopenworld/IncuNest-Docs](https://github.com/medicalopenworld/IncuNest-Docs)
- **Three.js**: [threejs.org/docs](https://threejs.org/docs/)
- **Wokwi**: [docs.wokwi.com](https://docs.wokwi.com/)
- **Medical Open World**: [medicalopenworld.org](https://medicalopenworld.org)

## Support

For questions or issues:

- **GitHub Issues**: [github.com/medicalopenworld/IncuNest-Sim/issues](https://github.com/medicalopenworld/IncuNest-Sim/issues)
- **Email**: contact@medicalopenworld.org
- **Instagram**: [@medicalopenworld](https://www.instagram.com/medicalopenworld)

## License

See [LICENSE](LICENSE) file for details.

---

Made with ❤️ by Medical Open World

_"So that the place where a premature baby is born does not limit their chances of survival."_
