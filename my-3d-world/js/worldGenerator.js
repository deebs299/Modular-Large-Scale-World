import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import * as config from './config.js';
import * as factory from './objectFactory.js';

// --- Paste all the placement functions from your original file here ---
function placeTree(matrices, type, worldX, terrainY, worldZ) {
    const { pineTrunkMatrices, pineFoliageMatrices, regularTrunkMatrices, regularFoliageMatrices } = matrices;
    const isPine = type === 'pine';
    const TRUNK_HEIGHT = isPine ? 20.0 : 16.0;
    const FOLIAGE_Y_OFFSET = isPine ? TRUNK_HEIGHT : TRUNK_HEIGHT * 0.9;
    const scale = 0.9 + Math.random() * 0.5;

    const dummy = new THREE.Object3D();
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scale, scale, scale);
    dummy.position.set(worldX, terrainY, worldZ);
    dummy.updateMatrix();

    const trunkMatrices = isPine ? pineTrunkMatrices : regularTrunkMatrices;
    trunkMatrices.push(dummy.matrix.clone());

    dummy.position.set(worldX, terrainY + FOLIAGE_Y_OFFSET * scale, worldZ);
    dummy.updateMatrix();

    const foliageMatrices = isPine ? pineFoliageMatrices : regularFoliageMatrices;
    foliageMatrices.push(dummy.matrix.clone());
}
function placePalmTree(matrices, worldX, terrainY, worldZ) {
    const { palmTrunkMatrices, palmFrondMatrices } = matrices;
    const TRUNK_HEIGHT = 24.0 + Math.random() * 8;
    const scale = 0.8 + Math.random() * 0.4;

    const dummy = new THREE.Object3D();
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.position.set(worldX, terrainY, worldZ);
    dummy.updateMatrix();
    palmTrunkMatrices.push(dummy.matrix.clone());

    dummy.position.set(worldX, terrainY + (TRUNK_HEIGHT - 1.0) * scale, worldZ);
    dummy.updateMatrix();
    palmFrondMatrices.push(dummy.matrix.clone());
}
function placeGrass(matrices, worldX, terrainY, worldZ) {
    const scale = 1.0 + Math.random() * 0.8;
    const dummy = new THREE.Object3D();
    dummy.position.set(worldX, terrainY, worldZ);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    matrices.grassMatrices.push(dummy.matrix.clone());
}
function placeRock(matrices, worldX, terrainY, worldZ) {
    const scale = 1.5 + Math.random() * 3.0;
    const dummy = new THREE.Object3D();
    dummy.position.set(worldX, terrainY - 0.5, worldZ);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
    dummy.updateMatrix();
    matrices.rockMatrices.push(dummy.matrix.clone());
}
function placeBoulder(matrices, worldX, terrainY, worldZ) {
    const scale = 8.0 + Math.random() * 8.0;
    const dummy = new THREE.Object3D();
    dummy.position.set(worldX, terrainY, worldZ);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(scale, scale * (0.7 + Math.random() * 0.6), scale * (0.7 + Math.random() * 0.6));
    dummy.updateMatrix();
    matrices.boulderMatrices.push(dummy.matrix.clone());
}
function placeCoral(matrices, worldX, terrainY, worldZ) {
    const scale = 1.0 + Math.random() * 1.5;
    const dummy = new THREE.Object3D();
    dummy.position.set(worldX, terrainY - 1, worldZ);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    matrices.coralMatrices.push(dummy.matrix.clone());
}
function placeSeaweed(matrices, worldX, terrainY, worldZ) {
    const scale = 0.5 + Math.random() * 0.5;
    const dummy = new THREE.Object3D();
    dummy.position.set(worldX, terrainY, worldZ);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(1, scale, 1);
    dummy.updateMatrix();
    matrices.seaweedMatrices.push(dummy.matrix.clone());
}

// vvvvv  THIS IS THE FIX vvvvv
export class World {
// ^^^^^ THIS IS THE FIX ^^^^^
    constructor(scene, animatedMaterials) {
        this.noiseGens = {
            baseNoise: createNoise2D(() => Math.random()), mountainNoise: createNoise2D(() => Math.random()),
            detailNoise: createNoise2D(() => Math.random()), treeNoise: createNoise2D(() => Math.random()),
            colorNoise: createNoise2D(() => Math.random()), grassNoise: createNoise2D(() => Math.random()),
            palmNoise: createNoise2D(() => Math.random()), rockNoise: createNoise2D(() => Math.random()),
            boulderNoise: createNoise2D(() => Math.random()), coralNoise: createNoise2D(() => Math.random()),
            seaweedNoise: createNoise2D(() => Math.random()), islandsMaskNoise: createNoise2D(() => Math.random())
        };

        const placementMatrices = {
            pineTrunkMatrices: [], pineFoliageMatrices: [], regularTrunkMatrices: [], regularFoliageMatrices: [], 
            grassMatrices: [], palmTrunkMatrices: [], palmFrondMatrices: [], rockMatrices: [], 
            boulderMatrices: [], coralMatrices: [], seaweedMatrices: []
        };

        for (let cz = 0; cz < config.WORLD_CHUNKS; cz++) {
            for (let cx = 0; cx < config.WORLD_CHUNKS; cx++) {
                const offsetX = (cx - (config.WORLD_CHUNKS - 1) / 2) * config.CHUNK_SIZE;
                const offsetZ = (cz - (config.WORLD_CHUNKS - 1) / 2) * config.CHUNK_SIZE;
                const chunkMesh = this._generateChunk(offsetX, offsetZ, placementMatrices);
                scene.add(chunkMesh);
            }
        }
        
        factory.createInstancedTrees(scene, placementMatrices.pineTrunkMatrices, placementMatrices.pineFoliageMatrices, 'pine');
        factory.createInstancedTrees(scene, placementMatrices.regularTrunkMatrices, placementMatrices.regularFoliageMatrices, 'regular');
        factory.createInstancedPalmTrees(scene, placementMatrices.palmTrunkMatrices, placementMatrices.palmFrondMatrices);
        factory.createInstancedRocks(scene, placementMatrices.rockMatrices);
        factory.createInstancedBoulders(scene, placementMatrices.boulderMatrices);
        factory.createInstancedCorals(scene, placementMatrices.coralMatrices);
        factory.createInstancedSeaweed(scene, placementMatrices.seaweedMatrices, animatedMaterials.seaweed);
        factory.createInstancedGrass(scene, placementMatrices.grassMatrices, animatedMaterials.grass);
    }

    getTerrainHeight(worldX, worldZ) {
        const noiseGens = this.noiseGens;
        const islandsMaskFreq = 1.8 / config.TOTAL_WORLD_SIZE;
        const islandsMaskValue = (noiseGens.islandsMaskNoise(worldX * islandsMaskFreq, worldZ * islandsMaskFreq) + 1) / 2;
        const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
        const gradientRadius = config.TOTAL_WORLD_SIZE * 0.45;
        const circularGradient = 1.0 - Math.pow(distFromCenter / gradientRadius, 2.0);
        let islandShapeMask = THREE.MathUtils.clamp(islandsMaskValue * circularGradient, 0, 1);
        islandShapeMask = THREE.MathUtils.smoothstep(islandShapeMask, 0.15, 0.55);

        let baseHeight = noiseGens.baseNoise(worldX * 0.5 / config.TOTAL_WORLD_SIZE, worldZ * 0.5 / config.TOTAL_WORLD_SIZE) * 100;
        let mountainVal = (noiseGens.mountainNoise(worldX * 2.5 / config.TOTAL_WORLD_SIZE, worldZ * 2.5 / config.TOTAL_WORLD_SIZE) + 1) / 2;
        baseHeight += Math.pow(mountainVal, 3.0) * 250;
        baseHeight += noiseGens.detailNoise(worldX * 15.0 / config.TOTAL_WORLD_SIZE, worldZ * 15.0 / config.TOTAL_WORLD_SIZE) * 15;

        const oceanFloorDepth = -500;
        let height = THREE.MathUtils.lerp(oceanFloorDepth, baseHeight, islandShapeMask);

        if (islandShapeMask < 0.1) {
            height += noiseGens.detailNoise(worldX * 5.0 / config.TOTAL_WORLD_SIZE, worldZ * 5.0 / config.TOTAL_WORLD_SIZE) * 5;
        }
        if (height > config.WATER_LEVEL) {
            const beachZoneEnd = config.WATER_LEVEL + 6;
            if (height < beachZoneEnd) {
                height = THREE.MathUtils.lerp(height, config.WATER_LEVEL + 0.5, (1 - (height - config.WATER_LEVEL) / (beachZoneEnd - config.WATER_LEVEL)) * 0.75);
            }
        }
        return height;
    }
    
    _generateChunk(offsetX, offsetZ, placementMatrices) {
        const geometry = new THREE.PlaneGeometry(config.CHUNK_SIZE, config.CHUNK_SIZE, config.SEGMENTS, config.SEGMENTS);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position;
        const colors = new Float32Array(positions.count * 3);
        const noiseGens = this.noiseGens;

        for (let i = 0; i < positions.count; i++) {
            const localX = positions.getX(i);
            const localZ = positions.getZ(i);
            const worldX = offsetX + localX;
            const worldZ = offsetZ + localZ;

            const height = this.getTerrainHeight(worldX, worldZ);
            positions.setY(i, height);
        }

        geometry.computeVertexNormals();

        for (let i = 0; i < positions.count; i++) {
            const height = positions.getY(i);
            const worldX = offsetX + positions.getX(i);
            const worldZ = offsetZ + positions.getZ(i);
            const normalY = geometry.attributes.normal.getY(i);
            const slope = 1.0 - normalY;
            let finalColor = new THREE.Color();
            
            // --- Color Calculation ---
            if (height < config.WATER_LEVEL) finalColor.set(config.COLORS.SAND);
            else if (height < config.WATER_LEVEL + 8) finalColor.lerpColors(config.COLORS.SAND, config.COLORS.GRASS, (height - config.WATER_LEVEL) / 8.0);
            else if (height > 150) finalColor.lerpColors(config.COLORS.ROCK, config.COLORS.SNOW, Math.min((height - 150) / 60.0, 1.0));
            else {
                finalColor.set(config.COLORS.GRASS);
                finalColor.lerp(config.COLORS.GRASS_LIGHT, (noiseGens.colorNoise(worldX / 80, worldZ / 80) + 1) / 2 * 0.5);
                finalColor.lerp(config.COLORS.ROCK, THREE.MathUtils.smoothstep(slope, 0.25, 0.6));
            }
            finalColor.toArray(colors, i * 3);
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // --- Object Placement (loop over vertices) ---
        for(let i = 0; i < positions.count; i+=4) { 
             const worldX = offsetX + positions.getX(i);
             const worldZ = offsetZ + positions.getZ(i);
             const height = positions.getY(i);
             const slope = 1.0 - geometry.attributes.normal.getY(i);
             
            if (height > 120 || height < config.WATER_LEVEL - 15) {
                if ((noiseGens.boulderNoise(worldX / 150, worldZ / 150) + 1) / 2 > 0.65 && Math.random() < 0.08) {
                    placeBoulder(placementMatrices, worldX, height, worldZ);
                }
            }
            if (height > config.WATER_LEVEL + 5 && slope > 0.25 && Math.random() < 0.8) {
                placeRock(placementMatrices, worldX, height, worldZ);
            }
            if (height > config.WATER_LEVEL - 15 && height < config.WATER_LEVEL - 8 && slope < 0.2) {
                if ((noiseGens.coralNoise(worldX / 40, worldZ / 40) + 1) / 2 > 0.7 && Math.random() < 0.1) {
                    placeCoral(placementMatrices, worldX, height, worldZ);
                }
            }
            if (height > config.WATER_LEVEL - 25 && height < config.WATER_LEVEL - 8 && slope < 0.3) {
                if ((noiseGens.seaweedNoise(worldX / 20, worldZ / 20) + 1) / 2 > 0.5 && Math.random() < 0.3) {
                    placeSeaweed(placementMatrices, worldX, height, worldZ);
                }
            }
            if (height > config.WATER_LEVEL && height < config.WATER_LEVEL + 10 && slope < 0.2) {
                if ((noiseGens.palmNoise(worldX / 50, worldZ / 50) + 1) / 2 > 0.8 && Math.random() < 0.02) {
                    placePalmTree(placementMatrices, worldX, height, worldZ);
                }
            }
            if (slope < 0.4 && height > config.WATER_LEVEL + 8 && height < 100) {
                if ((noiseGens.treeNoise(worldX / 150, worldZ / 150) + 1) / 2 > 0.6) {
                    const isPine = height > 70;
                    if (isPine && Math.random() < 0.015) placeTree(placementMatrices, 'pine', worldX, height, worldZ);
                    else if (!isPine && Math.random() < 0.012) placeTree(placementMatrices, 'regular', worldX, height, worldZ);
                }
            }
            if (slope < 0.5 && height > config.WATER_LEVEL + 2 && height < 120) {
                if ((noiseGens.grassNoise(worldX / 10, worldZ / 10) + 1) / 2 > 0.4) {
                    if(Math.random() < 0.25) { 
                       placeGrass(placementMatrices, worldX, height, worldZ);
                    }
                }
            }
        }

        const terrainMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.1 }));
        terrainMesh.position.set(offsetX, 0, offsetZ);
        terrainMesh.receiveShadow = true;
        return terrainMesh;
    }
}