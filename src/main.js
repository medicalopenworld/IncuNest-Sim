import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimulationEngine } from './simulation.js';

class IncuNestVisualization {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.incubator = null;
        this.simulation = new SimulationEngine();
        
        this.init();
        this.createIncubator();
        this.setupLights();
        this.setupControls();
        this.animate();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 1000);
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        this.scene.fog = new THREE.Fog(0xf0f0f0, 50, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 12, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createIncubator() {
        this.incubator = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.BoxGeometry(10, 0.5, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe0e0e0,
            roughness: 0.5,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25;
        base.receiveShadow = true;
        this.incubator.add(base);
        
        // Main chamber (transparent)
        const chamberGeometry = new THREE.BoxGeometry(8, 5, 5);
        const chamberMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.0,
            transmission: 0.9,
            thickness: 0.5,
        });
        const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
        chamber.position.y = 2.75;
        chamber.castShadow = true;
        chamber.receiveShadow = true;
        this.incubator.add(chamber);
        
        // Chamber frame
        const frameGeometry = new THREE.BoxGeometry(8.2, 5.2, 5.2);
        const frameEdges = new THREE.EdgesGeometry(frameGeometry);
        const frameLine = new THREE.LineSegments(
            frameEdges,
            new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
        );
        frameLine.position.y = 2.75;
        this.incubator.add(frameLine);
        
        // Door (front panel)
        const doorGeometry = new THREE.BoxGeometry(3, 2.5, 0.1);
        const doorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1,
            metalness: 0.1,
        });
        this.door = new THREE.Mesh(doorGeometry, doorMaterial);
        this.door.position.set(0, 2.75, 2.55);
        this.door.castShadow = true;
        this.incubator.add(this.door);
        
        // Mattress
        const mattressGeometry = new THREE.BoxGeometry(6, 0.3, 3);
        const mattressMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4fc3f7,
            roughness: 0.8
        });
        const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
        mattress.position.y = 0.4;
        mattress.castShadow = true;
        this.incubator.add(mattress);
        
        // Heater element (bottom)
        const heaterGeometry = new THREE.CylinderGeometry(0.1, 0.1, 7, 16);
        const heaterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff6b6b,
            emissive: 0xff6b6b,
            emissiveIntensity: 0.5
        });
        this.heater = new THREE.Mesh(heaterGeometry, heaterMaterial);
        this.heater.rotation.z = Math.PI / 2;
        this.heater.position.y = 0.1;
        this.heater.castShadow = true;
        this.incubator.add(this.heater);
        
        // Fan (top)
        const fanGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32);
        const fanMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x90a4ae,
            roughness: 0.3,
            metalness: 0.5
        });
        this.fan = new THREE.Mesh(fanGeometry, fanMaterial);
        this.fan.position.set(3, 4.8, 0);
        this.fan.castShadow = true;
        this.incubator.add(this.fan);
        
        // Fan blades
        const bladeGeometry = new THREE.BoxGeometry(1.4, 0.05, 0.2);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x607d8b,
            roughness: 0.4,
            metalness: 0.6
        });
        this.fanBlades = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.y = (i * Math.PI * 2) / 3;
            this.fanBlades.add(blade);
        }
        this.fanBlades.position.set(3, 4.8, 0);
        this.incubator.add(this.fanBlades);
        
        // Temperature sensor (inside)
        const sensorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const sensorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffd54f,
            roughness: 0.2,
            metalness: 0.8
        });
        const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensor.position.set(-3, 3, 0);
        this.incubator.add(sensor);
        
        // Control panel (side)
        const panelGeometry = new THREE.BoxGeometry(0.1, 1.5, 1);
        const panelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x37474f,
            roughness: 0.5
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(4.15, 2.5, -1.5);
        this.incubator.add(panel);
        
        // Display screen on panel
        const screenGeometry = new THREE.PlaneGeometry(0.8, 0.5);
        const screenMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00e676,
            emissive: 0x00e676,
            emissiveIntensity: 0.5
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(4.2, 2.8, -1.5);
        screen.rotation.y = -Math.PI / 2;
        this.incubator.add(screen);
        
        this.scene.add(this.incubator);
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);
        
        // Point light for highlights
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }
    
    setupControls() {
        // Door toggle
        document.getElementById('toggle-door').addEventListener('click', () => {
            this.toggleDoor();
        });
        
        // Heater toggle
        document.getElementById('toggle-heater').addEventListener('click', () => {
            this.simulation.toggleHeater();
        });
        
        // Reset simulation
        document.getElementById('reset-sim').addEventListener('click', () => {
            this.simulation.reset();
        });
    }
    
    toggleDoor() {
        const currentZ = this.door.position.z;
        const targetZ = currentZ > 2.5 ? 3.5 : 4.5;
        
        const animate = () => {
            const diff = targetZ - this.door.position.z;
            if (Math.abs(diff) > 0.01) {
                this.door.position.z += diff * 0.1;
                requestAnimationFrame(animate);
            } else {
                this.door.position.z = targetZ;
            }
        };
        animate();
    }
    
    updateUI() {
        const data = this.simulation.getData();
        
        document.getElementById('temp-internal').textContent = data.temperature.toFixed(1) + '°C';
        document.getElementById('temp-setpoint').textContent = data.setpoint.toFixed(1) + '°C';
        document.getElementById('humidity').textContent = data.humidity.toFixed(0) + '%';
        document.getElementById('heater-status').textContent = data.heaterOn ? 'ON' : 'OFF';
        document.getElementById('fan-status').textContent = data.fanOn ? 'ON' : 'OFF';
        
        // Update heater visual
        if (data.heaterOn) {
            this.heater.material.emissiveIntensity = 0.8;
        } else {
            this.heater.material.emissiveIntensity = 0.2;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        
        // Rotate fan blades if fan is on
        if (this.simulation.getData().fanOn) {
            this.fanBlades.rotation.y += 0.1;
        }
        
        // Update simulation
        this.simulation.update();
        this.updateUI();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the application
new IncuNestVisualization();
