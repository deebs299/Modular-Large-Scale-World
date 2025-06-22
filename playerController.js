import * as THREE from 'three';

export class PlayerController {
    constructor(scene, getHeightAt) {
        this.scene = scene;
        this.getHeightAt = getHeightAt;
        this.camera = null;

        // Player properties
        this.moveSpeed = 45;
        this.sprintMultiplier = 2;
        this.jumpVelocity = 10;
        this.gravity = 30;

        this.velocity = new THREE.Vector3();
        this.onGround = false;
        this.isLocked = false;

        this.keys = {
            forward: false, backward: false, left: false,
            right: false, jump: false, sprint: false,
        };

        // Camera rig setup
        this.pitchObject = new THREE.Object3D();
        this.yawObject = new THREE.Object3D();
        this.yawObject.add(this.pitchObject);
        
        this._bindEvents();
    }

    _bindEvents() {
        document.addEventListener('keydown', (e) => this._onKeyDown(e));
        document.addEventListener('keyup', (e) => this._onKeyUp(e));
        document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    }
    
    // Called by the main App to take control
    enable(camera) {
        this.camera = camera;
        this.isLocked = true;
        this.scene.add(this.yawObject);

        // Sync player rig to the camera's current state
        this.camera.getWorldPosition(this.yawObject.position);
        const cameraEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.yawObject.rotation.y = cameraEuler.y;
        this.pitchObject.rotation.x = cameraEuler.x;

        // Attach camera to the rig
        this.pitchObject.add(this.camera);
    }

    // Called by the main App to release control
    disable() {
        if (!this.camera) return;
        this.isLocked = false;
        // Detach camera and move it back to the scene root
        this.scene.add(this.camera);
        this.scene.remove(this.yawObject);
        this.camera = null;
    }

    _onKeyDown(e) {
        if (!this.isLocked) return;
        switch (e.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.jump = true; break;
            case 'ShiftLeft': this.keys.sprint = true; break;
        }
    }

    _onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'ShiftLeft': this.keys.sprint = false; break;
        }
    }

    _onMouseMove(event) {
        if (!this.isLocked) return;
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        this.yawObject.rotation.y -= movementX * 0.002;
        this.pitchObject.rotation.x -= movementY * 0.002;
        this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    }

    update(delta) {
        if (!this.isLocked || !this.camera) return;

        // Apply gravity
        this.velocity.y -= this.gravity * delta;

        // Movement direction
        const direction = new THREE.Vector3(
            Number(this.keys.left) - Number(this.keys.right),
            0,
            Number(this.keys.forward) - Number(this.keys.backward)
        );

        const speed = this.moveSpeed * (this.keys.sprint ? this.sprintMultiplier : 1);

        if (direction.lengthSq() > 0) {
            direction.normalize().applyQuaternion(this.yawObject.quaternion);
            this.velocity.x = direction.x * speed;
            this.velocity.z = direction.z * speed;
        } else {
            // Friction
            this.velocity.x *= (1 - delta * 10);
            this.velocity.z *= (1 - delta * 10);
        }
        
        // Jumping
        if (this.keys.jump && this.onGround) {
            this.velocity.y = this.jumpVelocity;
        }

        // Apply velocity to the player rig
        this.yawObject.position.x += this.velocity.x * delta;
        this.yawObject.position.z += this.velocity.z * delta;
        this.yawObject.position.y += this.velocity.y * delta;
        
        // Ground collision
        const groundY = this.getHeightAt(this.yawObject.position.x, this.yawObject.position.z);
        const playerHeight = 2.0;

        if (this.yawObject.position.y < groundY + playerHeight) {
            this.yawObject.position.y = groundY + playerHeight;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }
}