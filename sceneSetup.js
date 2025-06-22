import * as THREE from 'three';
import { TOTAL_WORLD_SIZE } from './config.js';

/**
 * Sets up the lighting for the scene.
 * @param {THREE.Scene} scene - The scene to add lights to.
 */
export function setupLighting(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(-2500, 2000, 2500);
    sunLight.castShadow = true;

    const shadowMapSize = 4096;
    const shadowCameraSize = TOTAL_WORLD_SIZE * 1.5;
    sunLight.shadow.mapSize.width = shadowMapSize;
    sunLight.shadow.mapSize.height = shadowMapSize;
    sunLight.shadow.camera.left = -shadowCameraSize;
    sunLight.shadow.camera.right = shadowCameraSize;
    sunLight.shadow.camera.top = shadowCameraSize;
    sunLight.shadow.camera.bottom = -shadowCameraSize;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 10000;
    scene.add(sunLight);
}

/**
 * Handles window resize events.
 * @param {THREE.PerspectiveCamera} camera - The camera to update.
 * @param {THREE.WebGLRenderer} renderer - The renderer to update.
 */
export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
