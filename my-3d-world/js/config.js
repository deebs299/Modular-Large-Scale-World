import * as THREE from 'three';

// --- WORLD CONFIGURATION ---
export const WORLD_CHUNKS = 8;
export const CHUNK_SIZE = 500;
export const SEGMENTS = 128; 
export const TOTAL_WORLD_SIZE = WORLD_CHUNKS * CHUNK_SIZE;
export const WATER_LEVEL = 10.0;

// --- COLOR PALETTE ---
export const COLORS = {
    SAND: new THREE.Color("#e0cda7"),
    GRASS: new THREE.Color("#55904C"),
    GRASS_LIGHT: new THREE.Color("#71a269"),
    ROCK: new THREE.Color("#a9a9a9"),
    ROCK_DARK: new THREE.Color("#525252"),
    SNOW: new THREE.Color("#FFFFFF"),
    WATER_SHALLOW: new THREE.Color("#1E90FF"),
    WATER_DEEP: new THREE.Color("#000080"),
    GRASS_BLADE: new THREE.Color("#4a8542"),
    PALM_TRUNK: new THREE.Color("#be9a6f"),
    PALM_FROND: new THREE.Color("#5a933e"),
    CORAL: new THREE.Color("#FF7F50"),
    SEAWEED: new THREE.Color("#20B2AA"),
};
