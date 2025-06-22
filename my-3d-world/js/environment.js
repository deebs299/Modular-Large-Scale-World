import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as config from './config.js';

function createSingleCloudGeometry() {
    const puffs = [];
    const puffCount = 15;
    const baseColor = new THREE.Color(0xffffff);

    for (let i = 0; i < puffCount; i++) {
        // Increased subdivision to make puffs rounder
        const puffGeo = new THREE.IcosahedronGeometry(1, 2);
        
        // Randomize the size and position of each small puff to create a cluster
        const scale = 3 + Math.random() * 5;
        puffGeo.scale(scale, scale, scale);
        puffGeo.translate(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 25
        );
        
        // Add vertex colors for subtle shading
        const colors = [];
        const positions = puffGeo.attributes.position;
        const color = new THREE.Color();

        for (let j = 0; j < positions.count; j++) {
            // Make the bottom of each puff slightly darker
            const y = positions.getY(j);
            const darkness = Math.max(0, -y / scale) * 0.15; // More darkness for lower vertices
            color.copy(baseColor).lerp(new THREE.Color(0x777777), darkness);
            colors.push(color.r, color.g, color.b);
        }
        puffGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        puffs.push(puffGeo);
    }
    
    const cloudGeo = mergeGeometries(puffs);
    return cloudGeo;
}


export function createClouds(scene) {
    const CLOUD_COUNT = 150;
    const cloudGeo = createSingleCloudGeometry();

    cloudGeo.computeBoundingSphere();

    // --- MODIFICATION: Updated material to be more transparent ---
    const cloudMat = new THREE.MeshStandardMaterial({
        roughness: 0.9,
        transparent: true,
        opacity: 0.2, // This makes the clouds 80% transparent
        vertexColors: true 
    });

    const cloudMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, CLOUD_COUNT);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < CLOUD_COUNT; i++) {
        const worldX = (Math.random() - 0.5) * config.TOTAL_WORLD_SIZE * 1.5;
        const worldZ = (Math.random() - 0.5) * config.TOTAL_WORLD_SIZE * 1.5;
        // --- MODIFICATION: Reduced altitude by half ---
        const altitude = 1400 + Math.random() * 800;
        
        // Increased scale variation for more diversity
        const scale = 10 + Math.random() * 25;

        dummy.position.set(worldX, altitude, worldZ);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        cloudMesh.setMatrixAt(i, dummy.matrix);
    }
    
    cloudMesh.instanceMatrix.needsUpdate = true;
    cloudMesh.frustumCulled = true;


    scene.add(cloudMesh);
    return cloudMesh;
}

export function createWater(scene, getHeightAt) {
    const waterSegments = 100;
    const oceanGeometry = new THREE.PlaneGeometry(
        config.TOTAL_WORLD_SIZE * 3,
        config.TOTAL_WORLD_SIZE * 3,
        waterSegments,
        waterSegments
    );

    const oceanMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95,
        vertexColors: true
    });

    const colors = [];
    const positions = oceanGeometry.attributes.position;
    const tempColor = new THREE.Color();
    
    const maxDepthForGradient = 700.0; 

    for (let i = 0; i < positions.count; i++) {
        const localX = positions.getX(i);
        const localY = positions.getY(i);
        const worldX = localX;
        const worldZ = -localY;
        
        const terrainY = getHeightAt(worldX, worldZ);
        const depth = config.WATER_LEVEL - terrainY;
        const ratio = Math.min(Math.max(0, depth / maxDepthForGradient), 1.0);
        
        tempColor.copy(config.COLORS.WATER_SHALLOW).lerp(config.COLORS.WATER_DEEP, ratio);
        
        colors.push(tempColor.r, tempColor.g, tempColor.b);
    }
    oceanGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = config.WATER_LEVEL;
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);
    return oceanMesh;
}
