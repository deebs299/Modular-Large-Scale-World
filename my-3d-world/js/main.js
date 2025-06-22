import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PlayerController } from './playerController.js';
import { World } from './worldGenerator.js';
import { createWater, createClouds } from './environment.js';
import { setupLighting, onWindowResize } from './sceneSetup.js';
import * as config from './config.js';

class App {
    constructor() {
        // Core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 15000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();

        // Game components
        this.orbitControls = null;
        this.player = null;
        this.world = null;
        this.water = null;
        this.clouds = null;
        
        // State
        this.inFPSMode = false;
        this.animatedMaterials = { grass: [], seaweed: [] };

        this._initializeApp();
    }

    _initializeApp() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        setupLighting(this.scene);

        // World Generation
        this.world = new World(this.scene, this.animatedMaterials);
        const getHeightAt = this.world.getTerrainHeight.bind(this.world);
        
        // Environment
        this.water = createWater(this.scene, getHeightAt);
        this.clouds = createClouds(this.scene);
        
        // Controls Setup
        this._setupOrbitControls();
        this.player = new PlayerController(this.scene, getHeightAt);

        // Event Listeners
        this._setupEventListeners();

        // Start the animation loop
        this.animate();
    }

    _setupOrbitControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(250, 100, 250);
        this.orbitControls.target.set(0, config.WATER_LEVEL + 20, 0);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.1;
        this.orbitControls.update();
    }

    _setupEventListeners() {
        window.addEventListener('resize', () => onWindowResize(this.camera, this.renderer));

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') this._enterFPSMode();
            if (e.code === 'Tab') this._exitFPSMode();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                this.inFPSMode = true;
                this.player.isLocked = true;
            } else {
                // User pressed 'Esc' or exited via 'Tab'
                this._exitFPSMode(true); 
            }
        });
    }

    _enterFPSMode() {
        if (this.inFPSMode) return;
        
        this.orbitControls.enabled = false;
        this.player.enable(this.camera);
        this.renderer.domElement.requestPointerLock();
        document.getElementById('info').style.opacity = '0.8';
    }

    _exitFPSMode(force = false) {
        if (!this.inFPSMode && !force) return;
        
        this.inFPSMode = false;
        this.player.isLocked = false;
        this.player.disable();

        // Update orbit controls to look where the player was looking
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.orbitControls.target.copy(this.camera.position).add(forward.multiplyScalar(20));
        
        this.orbitControls.enabled = true;
        document.exitPointerLock();
        document.getElementById('info').style.opacity = '1';
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const elapsedTime = this.clock.getElapsedTime();

        if (this.inFPSMode) {
            this.player.update(delta);
        } else {
            this.orbitControls.update();
        }

        // Animate water
        if (this.water) {
            this.water.position.y = config.WATER_LEVEL + Math.sin(elapsedTime * 0.5) * 0.2;
        }

        // Animate shader-based materials
        this.animatedMaterials.grass.forEach(mat => mat.userData.time.value = elapsedTime);
        this.animatedMaterials.seaweed.forEach(mat => mat.userData.time.value = elapsedTime);

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the application
new App();