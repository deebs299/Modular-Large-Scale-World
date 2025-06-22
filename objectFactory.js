import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as config from './config.js';

// --- GEOMETRY HELPERS ---

function createCoralGeometry() {
    const coralGeometries = [];
    const mainStem = new THREE.CylinderGeometry(0.2, 0.3, 3, 6);
    coralGeometries.push(mainStem);

    for(let i = 0; i < 10; i++) {
        const branchGeo = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 6);
        branchGeo.translate(0, 0.75, 0);
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            Math.random() * Math.PI/2, Math.random() * Math.PI*2, Math.random() * Math.PI/2
        ));
        branchGeo.applyQuaternion(quat);
        branchGeo.translate(0, (Math.random()-0.5) * 1.5, 0);
        coralGeometries.push(branchGeo);
    }
    return mergeGeometries(coralGeometries);
}


// --- INSTANCING FUNCTIONS ---

export function createInstancedTrees(scene, trunkMatrices, foliageMatrices, type) {
    if (trunkMatrices.length === 0) return;
    let trunkGeo, foliageGeo, trunkMat, foliageMat;
    const trunkHeight = type === 'pine' ? 20.0 : 16.0;

    if (type === 'pine') {
        trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, trunkHeight, 8);
        trunkGeo.translate(0, trunkHeight/2, 0);
        foliageGeo = new THREE.ConeGeometry(7, 25, 8); 
        foliageGeo.translate(0, 12.5, 0);
        trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e584b, roughness: 1.0 });
        foliageMat = new THREE.MeshStandardMaterial({ color: 0x3d5e4a, roughness: 1.0 });
    } else {
        trunkGeo = new THREE.CylinderGeometry(1.0, 1.6, trunkHeight, 8);
        trunkGeo.translate(0, trunkHeight/2, 0);
        foliageGeo = new THREE.IcosahedronGeometry(8.0, 1);
        trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 1.0 });
        foliageMat = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 1.0 });
    }
    
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, trunkMatrices.length);
    trunkMatrices.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
    trunkMesh.castShadow = true; 
    scene.add(trunkMesh);
    
    const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, foliageMatrices.length);
    foliageMatrices.forEach((m, i) => foliageMesh.setMatrixAt(i, m));
    foliageMesh.castShadow = true; 
    scene.add(foliageMesh);
}

export function createInstancedPalmTrees(scene, trunkMatrices, frondMatrices) {
    if (trunkMatrices.length === 0) return;
    const trunkHeight = 28;
    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, trunkHeight, 8);
    const positions = trunkGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const normalizedY = (y + trunkHeight / 2) / trunkHeight;
        const bendAmount = Math.sin(normalizedY * Math.PI) * 3.0;
        positions.setX(i, positions.getX(i) + bendAmount);
    }
    trunkGeo.translate(0, trunkHeight/2, 0);
    trunkGeo.computeVertexNormals();
    const trunkMat = new THREE.MeshStandardMaterial({ color: config.COLORS.PALM_TRUNK, roughness: 1.0 });

    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, trunkMatrices.length);
    trunkMatrices.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
    trunkMesh.castShadow = true;
    scene.add(trunkMesh);

    const frondGeo = new THREE.BufferGeometry();
    const frondVertices = [], frondIndices = [];
    let indexOffset = 0;
    const frondCount = 5;
    for (let i = 0; i < frondCount; i++) {
        const angle = (i / frondCount) * Math.PI * 2 + Math.random() * 0.5;
        const rotation = new THREE.Euler(0, angle, Math.random() * 0.2 + 0.6);
        const singleFrondPoints = [];
        const frondLength = 16, frondWidth = 4, segments = 8;
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            singleFrondPoints.push(new THREE.Vector3(t * frondLength, -t * t * 5.0, Math.sin(t * Math.PI) * (frondWidth / 2) * (1-t)));
        }
        for (let j = segments; j >= 0; j--) {
            const t = j / segments;
            singleFrondPoints.push(new THREE.Vector3(t * frondLength, -t * t * 5.0, -Math.sin(t * Math.PI) * (frondWidth / 2) * (1-t)));
        }
        singleFrondPoints.forEach(p => { p.applyEuler(rotation); frondVertices.push(p.x, p.y, p.z); });
        const numPointsPerSide = segments + 1;
        for (let j = 0; j < segments; j++) {
            const p1 = indexOffset + j, p2 = indexOffset + j + 1;
            const p3 = indexOffset + (2 * numPointsPerSide - 2 - j), p4 = indexOffset + (2 * numPointsPerSide - 1 - j);
            frondIndices.push(p1, p3, p2); frondIndices.push(p2, p3, p4);
        }
        indexOffset += singleFrondPoints.length;
    }
    frondGeo.setAttribute('position', new THREE.Float32BufferAttribute(frondVertices, 3));
    frondGeo.setIndex(frondIndices);
    frondGeo.computeVertexNormals();
    const frondMat = new THREE.MeshStandardMaterial({ color: config.COLORS.PALM_FROND, roughness: 1.0, side: THREE.DoubleSide });
    
    const frondMesh = new THREE.InstancedMesh(frondGeo, frondMat, frondMatrices.length);
    frondMatrices.forEach((m, i) => frondMesh.setMatrixAt(i, m));
    frondMesh.castShadow = true;
    scene.add(frondMesh);
}

export function createInstancedRocks(scene, rockMatrices) {
    if (rockMatrices.length === 0) return;
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const noise = createNoise2D(() => Math.random());
    const positions = rockGeo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const tempVec = new THREE.Vector3(); const tempColor = new THREE.Color();
    for(let i = 0; i < positions.count; i++) {
        tempVec.fromBufferAttribute(positions, i);
        const v_noise = noise(tempVec.x * 3, tempVec.y * 3);
        tempVec.multiplyScalar(1 + v_noise * 0.3);
        positions.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
        tempColor.copy(config.COLORS.ROCK).lerp(config.COLORS.ROCK_DARK, (v_noise + 1) / 2 * 0.8).toArray(colors, i*3);
    }
    rockGeo.computeVertexNormals();
    rockGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const rockMat = new THREE.MeshStandardMaterial({ roughness: 0.8, vertexColors: true });
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockMatrices.length);
    rockMatrices.forEach((m, i) => rockMesh.setMatrixAt(i, m));
    rockMesh.castShadow = true; rockMesh.receiveShadow = true;
    scene.add(rockMesh);
}

export function createInstancedBoulders(scene, boulderMatrices) {
    if (boulderMatrices.length === 0) return;
    const boulderGeo = new THREE.IcosahedronGeometry(1, 1);
    const noise = createNoise2D(() => Math.random());
    const positions = boulderGeo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const tempVec = new THREE.Vector3(); const tempColor = new THREE.Color();
    for(let i = 0; i < positions.count; i++) {
        tempVec.fromBufferAttribute(positions, i);
        const v_noise = noise(tempVec.x * 2.0, tempVec.y * 2.0);
        tempVec.multiplyScalar(1 + v_noise * 0.4);
        positions.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
        tempColor.copy(config.COLORS.ROCK).lerp(config.COLORS.ROCK_DARK, (v_noise + 1) / 2 * 0.6).toArray(colors, i*3);
    }
    boulderGeo.computeVertexNormals();
    boulderGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const boulderMat = new THREE.MeshStandardMaterial({ roughness: 0.9, vertexColors: true });
    const boulderMesh = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderMatrices.length);
    boulderMatrices.forEach((m, i) => boulderMesh.setMatrixAt(i, m));
    boulderMesh.castShadow = true; boulderMesh.receiveShadow = true;
    scene.add(boulderMesh);
}

export function createInstancedCorals(scene, coralMatrices) {
    if (coralMatrices.length === 0) return;
    const coralGeo = createCoralGeometry();
    const coralMat = new THREE.MeshStandardMaterial({ color: config.COLORS.CORAL, roughness: 0.8 });
    const coralMesh = new THREE.InstancedMesh(coralGeo, coralMat, coralMatrices.length);
    coralMatrices.forEach((m, i) => coralMesh.setMatrixAt(i, m));
    coralMesh.castShadow = true; coralMesh.receiveShadow = true;
    scene.add(coralMesh);
}

export function createInstancedSeaweed(scene, seaweedMatrices, animatedMaterialArray) {
    if (seaweedMatrices.length === 0) return;
    const h = 8;
    const seaweedGeo = new THREE.PlaneGeometry(1, h, 1, 10);
    seaweedGeo.translate(0, h/2, 0);

    const seaweedMat = new THREE.MeshStandardMaterial({
        color: config.COLORS.SEAWEED, roughness: 1.0, side: THREE.DoubleSide
    });
    seaweedMat.userData.time = { value: 0 };
    
    seaweedMat.onBeforeCompile = shader => {
        shader.uniforms.time = seaweedMat.userData.time;
        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
                #include <begin_vertex>
                float bendFactor = pow(position.y / ${h.toFixed(1)}, 2.0);
                vec3 instancePosition = vec3(instanceMatrix[3]);
                float angle = time * 0.8 + instancePosition.x * 0.3 + instancePosition.z * 0.3;
                float displacement = sin(angle) * 0.5;
                transformed.x += displacement * bendFactor;
            `
        );
    };
    animatedMaterialArray.push(seaweedMat);

    const seaweedMesh = new THREE.InstancedMesh(seaweedGeo, seaweedMat, seaweedMatrices.length);
    seaweedMatrices.forEach((m, i) => seaweedMesh.setMatrixAt(i, m));
    scene.add(seaweedMesh);
}

export function createInstancedGrass(scene, grassMatrices, animatedMaterialArray) {
    if (grassMatrices.length === 0) return;
    const clumpGeo = new THREE.BufferGeometry();
    const w = 0.3, h = 2.5;
    const verticesList = [-w/2,0,0, w/2,0,0, w/2,h,0, -w/2,h,0, -w/2,0,0, w/2,0,0, w/2,h,0, -w/2,h,0, -w/2,0,0, w/2,0,0, w/2,h,0, -w/2,h,0];
    const vertices = new Float32Array(verticesList);
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI / 3);
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI / 3);
    for(let i=4; i<8; i++) new THREE.Vector3().fromArray(vertices, i*3).applyQuaternion(q1).toArray(vertices, i*3);
    for(let i=8; i<12; i++) new THREE.Vector3().fromArray(vertices, i*3).applyQuaternion(q2).toArray(vertices, i*3);
    
    clumpGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    clumpGeo.setIndex([0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11]);
    clumpGeo.computeVertexNormals();
    
    const grassMat = new THREE.MeshStandardMaterial({ color: config.COLORS.GRASS_BLADE, roughness: 1.0, side: THREE.DoubleSide });
    grassMat.userData.time = { value: 0 };
    
    grassMat.onBeforeCompile = shader => {
        shader.uniforms.time = grassMat.userData.time;
        shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
                #include <begin_vertex>
                float bendFactor = pow(position.y / ${h.toFixed(1)}, 2.0);
                vec3 instancePosition = vec3(instanceMatrix[3]);
                float angle = time * 2.0 + instancePosition.x * 0.2 + instancePosition.z * 0.2;
                float displacement = sin(angle) * 0.25;
                transformed.x += displacement * bendFactor;
            `
        );
    };
    animatedMaterialArray.push(grassMat);

    const grassMesh = new THREE.InstancedMesh(clumpGeo, grassMat, grassMatrices.length);
    grassMatrices.forEach((m, i) => grassMesh.setMatrixAt(i, m));
    grassMesh.castShadow = false;
    scene.add(grassMesh);
}
