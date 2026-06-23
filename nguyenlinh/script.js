// --- 3D Heart Canvas with Hover Physics & Shaders ---

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("heart-canvas");
    const scene = new THREE.Scene();
    
    // Camera setup - Set Z position to 35 for a smaller and more elegant appearance
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 36;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const clock = new THREE.Clock();

    // Resize Handler
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x150318, 2.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff2d55, 3.5, 100);
    pointLight.position.set(0, 0, 15);
    scene.add(pointLight);

    const mouse = { x: 0, y: 0, rawX: 0, rawY: 0 };
    window.addEventListener("mousemove", (e) => {
        mouse.rawX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.rawY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Spotlight follows mouse
        pointLight.position.x = mouse.rawX * 18;
        pointLight.position.y = mouse.rawY * 18;
    });

    window.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            mouse.rawX = (touch.clientX / window.innerWidth) * 2 - 1;
            mouse.rawY = -(touch.clientY / window.innerHeight) * 2 + 1;
            pointLight.position.x = mouse.rawX * 18;
            pointLight.position.y = mouse.rawY * 18;
        }
    });

    // ==========================================
    // SHADER DEFINITIONS FOR PREMIUM PARTICLES
    // ==========================================
    const vertexShader = `
        uniform float uTime;
        attribute float aSize;
        attribute float aSpeed;
        attribute vec3 aColor;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
            vColor = aColor;
            
            // Generate twinkling effect on GPU
            float twinkle = 1.0 + 0.35 * sin(uTime * 5.0 * aSpeed + aSize);
            vTwinkle = twinkle;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Set size and apply perspective attenuation
            gl_PointSize = aSize * twinkle * (320.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
            // Sample standard radial gradient point texture
            vec4 texColor = texture2D(uTexture, gl_PointCoord);
            if (texColor.a < 0.02) discard;
            
            // Multiply texture with particle color and apply brightness boost from twinkle
            vec3 finalColor = vColor * texColor.rgb * (1.0 + vTwinkle * 0.15);
            gl_FragColor = vec4(finalColor, texColor.a);
        }
    `;

    // ==========================================
    // 3D HEART GEOMETRY GENERATION
    // ==========================================
    function getHeartPoint(t, phi, r) {
        // Parametric equations for a 3D heart shell
        const x = 16 * Math.pow(Math.sin(t), 3) * Math.cos(phi);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        const z = 8 * Math.pow(Math.sin(t), 3) * Math.sin(phi);
        
        // Base scale: 0.65 (delivers a smaller, sharper, and sleeker heart mesh)
        const baseScale = 0.60;
        
        // Offset Y by +4 to center around origin
        return new THREE.Vector3(x * r * baseScale, (y + 4) * r * baseScale, z * r * baseScale);
    }

    function createGlowTexture() {
        const pCanvas = document.createElement("canvas");
        pCanvas.width = 32;
        pCanvas.height = 32;
        const pCtx = pCanvas.getContext("2d");
        
        const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        pCtx.fillStyle = gradient;
        pCtx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(pCanvas);
    }

    const particleCount = 7500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = [];
    const sizes = new Float32Array(particleCount);
    const originalSizes = [];
    const speeds = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const isShell = Math.random() > 0.22;
        const t = Math.random() * Math.PI;
        const phi = Math.random() * Math.PI * 2;
        const r = isShell ? (0.96 + Math.random() * 0.04) : (0.1 + Math.random() * 0.86);
        
        const pt = getHeartPoint(t, phi, r);
        
        // Subtle random noise
        const jitter = 0.15;
        const x = pt.x + (Math.random() - 0.5) * jitter;
        const y = pt.y + (Math.random() - 0.5) * jitter;
        const z = pt.z + (Math.random() - 0.5) * jitter;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        originalPositions.push(new THREE.Vector3(x, y, z));

        // Sizes: delicate and sharp
        const baseSize = Math.random() * 0.35 + 0.15;
        sizes[i] = baseSize;
        originalSizes.push(baseSize);

        // Individual twinkle speed indices
        speeds[i] = Math.random() * 0.8 + 0.4;

        // Beautiful multi-color gradient (magenta, violet, and gold sparks)
        let rColor, gColor, bColor;
        const colorSelect = Math.random();
        
        if (colorSelect < 0.55) {
            // Ruby Red / Neon Pink: #ff2d55
            rColor = 1.0; gColor = 0.12; bColor = 0.33;
        } else if (colorSelect < 0.88) {
            // Electric Violet: #9b2dff
            rColor = 0.60; gColor = 0.18; bColor = 1.0;
        } else {
            // Twinkling Golden Dust: #ffa62e
            rColor = 1.0; gColor = 0.65; bColor = 0.18;
        }

        colors[i * 3] = rColor + (Math.random() - 0.5) * 0.05;
        colors[i * 3 + 1] = gColor + (Math.random() - 0.5) * 0.05;
        colors[i * 3 + 2] = bColor + (Math.random() - 0.5) * 0.05;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    // Custom Shader Material setup
    const shaderUniforms = {
        uTime: { value: 0.0 },
        uTexture: { value: createGlowTexture() }
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
    });

    const heartPoints = new THREE.Points(geometry, shaderMaterial);
    scene.add(heartPoints);

    // ==========================================
    // FLOATING BACKGROUND COSMIC DUST
    // ==========================================
    const dustCount = 120;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];

    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 60;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 45;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        
        dustVelocities.push({
            x: (Math.random() - 0.5) * 0.01,
            y: Math.random() * 0.025 + 0.015,
            z: (Math.random() - 0.5) * 0.01
        });
    }

    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
        size: 0.18,
        color: 0xff4d77,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });

    const cosmicDust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(cosmicDust);

    // ==========================================
    // CLICK-TO-SPAWN BURST OF 3D SHINY HEARTS
    // ==========================================
    const burstHearts = [];
    const heartShape = new THREE.Shape();
    const sx = 0, sy = 0;
    heartShape.moveTo(sx + 5, sy + 5);
    heartShape.bezierCurveTo(sx + 5, sy + 5, sx + 4, sy, sx, sy);
    heartShape.bezierCurveTo(sx - 6, sy, sx - 6, sy + 7, sx - 6, sy + 7);
    heartShape.bezierCurveTo(sx - 6, sy + 11, sx - 3, sy + 15.4, sx + 5, sy + 19);
    heartShape.bezierCurveTo(sx + 12, sy + 15.4, sx + 16, sy + 11, sx + 16, sy + 7);
    heartShape.bezierCurveTo(sx + 16, sy + 7, sx + 16, sy, sx + 10, sy);
    heartShape.bezierCurveTo(sx + 7, sy, sx + 5, sy + 5, sx + 5, sy + 5);

    const extrudeSettings = {
        depth: 1.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.6,
        bevelThickness: 0.6
    };
    const heartMeshGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartMeshGeometry.center();

    function spawnBurst(posX, posY, posZ) {
        const count = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            const colorsList = [0xff2d55, 0x9b2dff, 0xffa62e];
            const colorHex = colorsList[Math.floor(Math.random() * colorsList.length)];
            
            const mat = new THREE.MeshPhongMaterial({
                color: colorHex,
                shininess: 120,
                specular: 0xffffff,
                transparent: true,
                opacity: 0.95,
                emissive: colorHex,
                emissiveIntensity: 0.15
            });
            
            const mesh = new THREE.Mesh(heartMeshGeometry, mat);
            const scale = Math.random() * 0.03 + 0.015;
            mesh.scale.set(scale, scale, scale);
            mesh.position.set(posX, posY, posZ);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 0.16 + 0.06;
            
            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed,
                Math.sin(angle) * Math.cos(elevation) * speed
            );
            
            const rotSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            scene.add(mesh);
            burstHearts.push({
                mesh: mesh,
                velocity: velocity,
                rotSpeed: rotSpeed,
                maxLife: 70 + Math.floor(Math.random() * 30),
                age: 0
            });
        }
    }

    window.addEventListener("pointerdown", (e) => {
        const vector = new THREE.Vector3(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        
        spawnBurst(pos.x, pos.y, pos.z);
    });

    // ==========================================
    // ANIMATION & HOVER ENGINE
    // ==========================================
    let pulsePhase = 0;

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.001;
        const dt = clock.getDelta();

        // Update uniforms for shaders (twinkling time counter)
        shaderUniforms.uTime.value = time;

        // --- A. Hover State calculations ---
        const mouseDist = Math.sqrt(mouse.rawX * mouse.rawX + mouse.rawY * mouse.rawY);
        
        let heartRate = 1.35; // Idle beat speed
        let pulseIntensity = 0.09; // Delicate pulsing expansion
        
        if (mouseDist < 0.6) {
            const hoverFactor = (0.6 - mouseDist) / 0.6;
            heartRate = 1.35 - hoverFactor * 0.72; // Speeds up heartbeat (down to 0.63s cycle)
            pulseIntensity = 0.09 + hoverFactor * 0.09; // Heart contraction gets stronger (up to 0.18 expansion)
        }

        pulsePhase += (dt / heartRate);
        const cycle = pulsePhase % 1.0;

        let pulse = 0;
        if (cycle < 0.16) {
            pulse = Math.sin((cycle / 0.16) * Math.PI) * pulseIntensity;
        } else if (cycle >= 0.20 && cycle < 0.34) {
            pulse = Math.sin(((cycle - 0.20) / 0.14) * Math.PI) * (pulseIntensity * 0.55);
        }
        const currentScale = 1 + pulse;
        heartPoints.scale.set(currentScale, currentScale, currentScale);

        // Animate the text overlay scaling and text-shadow pulsing in sync with the heartbeat
        const heartTextEl = document.getElementById("heart-text");
        if (heartTextEl) {
            const textScale = 1 + pulse * 0.7; // slightly dampened pulse for text readability
            heartTextEl.style.transform = `scale(${textScale})`;
            
            // Dynamic text shadow glow pulse
            const glowSpread1 = 10 + pulse * 18;
            const glowSpread2 = 20 + pulse * 28;
            heartTextEl.style.textShadow = `0 0 ${glowSpread1}px rgba(255, 45, 85, 0.95), 0 0 ${glowSpread2}px rgba(255, 45, 85, 0.6), 0 0 35px rgba(255, 45, 85, 0.35)`;
        }

        // --- B. Camera hover rotation follow ---
        mouse.x += (mouse.rawX * 0.45 - mouse.x) * 0.05;
        mouse.y += (mouse.rawY * 0.35 - mouse.y) * 0.05;

        // Base auto spin + cursor track
        heartPoints.rotation.y = time * 0.20 + mouse.x;
        heartPoints.rotation.x = mouse.y;

        // --- C. Local Particle Magnetic Distortion (Hover Push + Hover Glow) ---
        const mouse3D = new THREE.Vector3(mouse.rawX * 16, mouse.rawY * 16, 0);
        const localMouse = mouse3D.clone();
        heartPoints.worldToLocal(localMouse);

        const posAttr = geometry.attributes.position;
        const sizeAttr = geometry.attributes.aSize;
        const interactRadius = 5.0; // tighter radius for clean hover physics

        for (let i = 0; i < particleCount; i++) {
            const orig = originalPositions[i];
            const currentX = posAttr.getX(i);
            const currentY = posAttr.getY(i);
            const currentZ = posAttr.getZ(i);

            const dx = orig.x - localMouse.x;
            const dy = orig.y - localMouse.y;
            const dz = orig.z - localMouse.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

            let pushX = 0, pushY = 0, pushZ = 0;
            let sizeScale = 1.0;

            if (dist < interactRadius) {
                const force = (interactRadius - dist) / interactRadius;
                
                // 1. Magnetic push displacement vector
                const pushMag = force * 1.4;
                if (dist > 0.05) {
                    pushX = (dx / dist) * pushMag;
                    pushY = (dy / dist) * pushMag;
                    pushZ = (dz / dist) * pushMag;
                }

                // 2. Magnify particle size and glow on hover
                sizeScale = 1.0 + force * 1.5; // up to 2.5x size highlight
            }

            // Normal shimmering wave
            const wave = Math.sin(time * 3 + i) * 0.04;
            const targetX = orig.x + wave * (orig.x / 14) + pushX;
            const targetY = orig.y + wave * (orig.y / 14) + pushY;
            const targetZ = orig.z + wave * (orig.z / 14) + pushZ;

            // Interpolate position smoothly
            posAttr.setX(i, currentX + (targetX - currentX) * 0.08);
            posAttr.setY(i, currentY + (targetY - currentY) * 0.08);
            posAttr.setZ(i, currentZ + (targetZ - currentZ) * 0.08);

            // Interpolate sizing highlight smoothly for local particle glow
            const targetSize = originalSizes[i] * sizeScale;
            const currentSize = sizeAttr.getX(i);
            sizeAttr.setX(i, currentSize + (targetSize - currentSize) * 0.12);
        }
        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;

        // --- D. Floating Background Dust ---
        const dustAttr = dustGeometry.attributes.position;
        for (let i = 0; i < dustCount; i++) {
            let y = dustAttr.getY(i) + dustVelocities[i].y;
            let x = dustAttr.getX(i) + dustVelocities[i].x;
            let z = dustAttr.getZ(i) + dustVelocities[i].z;
            
            if (y > 25) {
                y = -25;
                x = (Math.random() - 0.5) * 60;
                z = (Math.random() - 0.5) * 30;
            }
            dustAttr.setX(i, x);
            dustAttr.setY(i, y);
            dustAttr.setZ(i, z);
        }
        dustAttr.needsUpdate = true;
        cosmicDust.rotation.y = time * 0.03;

        // --- E. Click-Burst Physics ---
        for (let i = burstHearts.length - 1; i >= 0; i--) {
            const item = burstHearts[i];
            item.age++;
            
            item.mesh.position.add(item.velocity);
            item.mesh.rotation.x += item.rotSpeed.x;
            item.mesh.rotation.y += item.rotSpeed.y;
            item.mesh.rotation.z += item.rotSpeed.z;
            
            item.velocity.multiplyScalar(0.975); // slight air resistance
            
            const lifeRatio = item.age / item.maxLife;
            if (lifeRatio >= 1) {
                scene.remove(item.mesh);
                item.mesh.geometry.dispose();
                item.mesh.material.dispose();
                burstHearts.splice(i, 1);
            } else {
                const currentScale = (1 - lifeRatio) * item.mesh.scale.x;
                item.mesh.material.opacity = (1 - lifeRatio) * 0.9;
                item.mesh.scale.set(currentScale, currentScale, currentScale);
            }
        }

        renderer.render(scene, camera);
    }

    animate();
});
