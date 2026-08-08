// ==========================================================================
// ECOSKYROOF - THE ULTIMATE 4-WAY ECO-CITY SIMULATION (UNIFORM HEIGHT)
// ==========================================================================

const container = document.getElementById('simulation-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020408);
scene.fog = new THREE.FogExp2(0x020408, 0.007); 

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(40, 60, 80); 
camera.lookAt(0, 10, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.1; 

// --- 1. الإضاءة (Day & Night) ---
let isDayMode = false;
const ambientLight = new THREE.AmbientLight(0x0a1525, 1.5); 
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0x00F0FF, 0.8);
mainLight.position.set(50, 100, -50);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 500;
mainLight.shadow.camera.left = -100;
mainLight.shadow.camera.right = 100;
mainLight.shadow.camera.top = 100;
mainLight.shadow.camera.bottom = -100;
scene.add(mainLight);

const streetLights = [];
const windowsArray = [];

// --- 2. بناء المدينة (4 شوارع وميدان - ارتفاعات متساوية) ---
const groundGeo = new THREE.PlaneGeometry(500, 500);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const roundaboutGeo = new THREE.CylinderGeometry(12, 12, 0.5, 32);
const roundaboutMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
const roundabout = new THREE.Mesh(roundaboutGeo, roundaboutMat);
roundabout.position.y = 0.25;
roundabout.receiveShadow = true;
scene.add(roundabout);

const markGeo = new THREE.PlaneGeometry(1, 4);
const markMat = new THREE.MeshBasicMaterial({color: 0xffffff});
for(let d = 20; d < 200; d += 12) {
    const mNS1 = new THREE.Mesh(markGeo, markMat); mNS1.rotation.x = -Math.PI/2; mNS1.position.set(0, 0.1, d); scene.add(mNS1);
    const mNS2 = new THREE.Mesh(markGeo, markMat); mNS2.rotation.x = -Math.PI/2; mNS2.position.set(0, 0.1, -d); scene.add(mNS2);
    const mEW1 = new THREE.Mesh(markGeo, markMat); mEW1.rotation.x = -Math.PI/2; mEW1.rotation.z = Math.PI/2; mEW1.position.set(d, 0.1, 0); scene.add(mEW1);
    const mEW2 = new THREE.Mesh(markGeo, markMat); mEW2.rotation.x = -Math.PI/2; mEW2.rotation.z = Math.PI/2; mEW2.position.set(-d, 0.1, 0); scene.add(mEW2);
}

// المقاسات الثابتة (لتوحيد العمارات والشبكة)
const roadWidth = 14; 
const bWidth = 18;
const bDepth = 18;
const bHeight = 35; // ارتفاع ثابت لكل العمارات!
const canopyHeight = bHeight; // الشبكة مساوية لسطح العمارة بالظبط!

const buildingColors = [0x1a1a24, 0x2c3e50, 0x111622, 0x232b38];

function createCityBlock(x, z, axis) {
    const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
    const buildingMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.2 }); 
    const building = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), buildingMat);
    building.position.set(x, bHeight/2, z);
    building.castShadow = true; building.receiveShadow = true;
    
    // شبابيك
    for(let i=0; i<12; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x00F0FF }));
        const isXAxis = axis === 'EW';
        const sideMultiplier = isXAxis ? (z > 0 ? -1 : 1) : (x > 0 ? -1 : 1);
        
        if (isXAxis) {
            win.position.set(x + (Math.random() * (bWidth-4)) - (bWidth-4)/2, (Math.random() * (bHeight - 8)) + 4, z + (sideMultiplier * (bDepth/2 + 0.1)));
            win.rotation.y = sideMultiplier === -1 ? Math.PI : 0;
        } else {
            win.position.set(x + (sideMultiplier * (bWidth/2 + 0.1)), (Math.random() * (bHeight - 8)) + 4, z + (Math.random() * (bDepth-4)) - (bDepth-4)/2);
            win.rotation.y = sideMultiplier === -1 ? -Math.PI/2 : Math.PI/2;
        }
        scene.add(win);
        windowsArray.push(win.material);
    }
    scene.add(building);

    // الخزانات البيضاء اللامعة فوق السطح
    const tankGeo = new THREE.CylinderGeometry(2.5, 2.5, 5, 32);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.5 }); 
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(x, bHeight + 2.5, z);
    tank.castShadow = true;
    scene.add(tank);

    // المواسير بتغذي الشبكة
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 8), tankMat);
    const sideDirection = axis === 'EW' ? (z > 0 ? -1 : 1) : (x > 0 ? -1 : 1);
    
    if (axis === 'EW') {
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(x, bHeight + 1, z + (sideDirection * 6));
    } else {
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(x + (sideDirection * 6), bHeight + 1, z);
    }
    scene.add(pipe);
}

// بناء الشبكة المعلقة (الوايرز)
function createCanopySegment(x, z, axis) {
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(x, canopyHeight, z); // مساوية للسطح

    const wireMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x6b4226 }); 
    const leafGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x00FF88 }); 

    const length = bWidth + 2;
    const span = roadWidth + 2; 

    // رسم الأسلاك (Wires)
    for(let w = -length/2; w <= length/2; w += 2.5) {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, span, 8), wireMat);
        if (axis === 'NS') {
            wire.rotation.z = Math.PI / 2;
            wire.position.set(0, 0, w);
        } else {
            wire.rotation.x = Math.PI / 2;
            wire.position.set(w, 0, 0);
        }
        wire.receiveShadow = true;
        canopyGroup.add(wire);
    }

    // الأحواض والزرع
    for(let p = -length/2 + 2; p <= length/2 - 2; p += 4) {
        const planter = new THREE.Mesh(new THREE.BoxGeometry(span - 2, 1, 2.5), planterMat);
        if (axis === 'NS') {
            planter.position.set(0, 0.5, p);
        } else {
            planter.rotation.y = Math.PI / 2;
            planter.position.set(p, 0.5, 0);
        }
        planter.castShadow = true;
        canopyGroup.add(planter);

        for(let l = -span/2 + 2; l <= span/2 - 2; l += 2.5) {
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            if (axis === 'NS') leaf.position.set(l, 1.5, p);
            else leaf.position.set(p, 1.5, l);
            leaf.scale.set(1, 0.6 + Math.random()*0.8, 1);
            canopyGroup.add(leaf);
        }
    }
    scene.add(canopyGroup);
}

// شبكة الميدان 
const centerCanopy = new THREE.Group();
centerCanopy.position.set(0, canopyHeight, 0); // مساوية للسطح
for(let r = -roadWidth/2; r <= roadWidth/2; r += 2) {
    const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, roadWidth, 8), new THREE.MeshStandardMaterial({color: 0xcccccc}));
    wire1.rotation.z = Math.PI/2; wire1.position.set(0, 0, r); centerCanopy.add(wire1);
    
    const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, roadWidth, 8), new THREE.MeshStandardMaterial({color: 0xcccccc}));
    wire2.rotation.x = Math.PI/2; wire2.position.set(r, 0, 0); centerCanopy.add(wire2);
}
const centerPlanter = new THREE.Mesh(new THREE.CylinderGeometry(roadWidth/2 - 2, roadWidth/2 - 2, 1, 32), new THREE.MeshStandardMaterial({ color: 0x6b4226 }));
centerPlanter.position.y = 0.5; centerCanopy.add(centerPlanter);
for(let i=0; i<40; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), new THREE.MeshStandardMaterial({ color: 0x00FF88 }));
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * (roadWidth/2 - 3);
    leaf.position.set(Math.cos(angle)*rad, 1.5, Math.sin(angle)*rad);
    leaf.scale.set(1, 0.5+Math.random(), 1);
    centerCanopy.add(leaf);
}
scene.add(centerCanopy);


const offset = roadWidth/2 + bWidth/2; 
for (let i = 1; i <= 5; i++) {
    let pos = (roadWidth/2) + (bWidth/2) + (i * (bWidth + 2)); 

    createCityBlock(offset, pos, 'NS');
    createCityBlock(-offset, pos, 'NS');
    createCanopySegment(0, pos, 'NS');

    createCityBlock(offset, -pos, 'NS');
    createCityBlock(-offset, -pos, 'NS');
    createCanopySegment(0, -pos, 'NS');

    createCityBlock(pos, offset, 'EW');
    createCityBlock(pos, -offset, 'EW');
    createCanopySegment(pos, 0, 'EW');

    createCityBlock(-pos, offset, 'EW');
    createCityBlock(-pos, -offset, 'EW');
    createCanopySegment(-pos, 0, 'EW');
}

// --- 3. الرذاذ (Misting) ---
const mistParticles = 5000; 
const mistGeo = new THREE.BufferGeometry();
const mistPos = new Float32Array(mistParticles * 3);
for(let i=0; i<mistParticles * 3; i+=3) {
    const isNS = Math.random() > 0.5;
    if (isNS) {
        mistPos[i] = (Math.random() * roadWidth) - roadWidth/2; 
        mistPos[i+2] = (Math.random() * 300) - 150; 
    } else {
        mistPos[i] = (Math.random() * 300) - 150; 
        mistPos[i+2] = (Math.random() * roadWidth) - roadWidth/2; 
    }
    mistPos[i+1] = Math.random() * canopyHeight;      
}
mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
const mistMat = new THREE.PointsMaterial({ color: 0x00F0FF, size: 0.15, transparent: true, opacity: 0.0 });
const mistSystem = new THREE.Points(mistGeo, mistMat);
scene.add(mistSystem);


// --- 4. العربيات والدخان الخفيف ---
const cars = [];
const smokeParticles = [];
const smokeGeo = new THREE.SphereGeometry(0.15, 6, 6); // حجم الدخان صغر للنص
const smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.15 }); // الشفافية زادت جداً

function spawnCar() {
    const carGroup = new THREE.Group();
    const carColor = Math.random() * 0xffffff;
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 5), new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.6 }));
    body.position.y = 0.8; body.castShadow = true; carGroup.add(body);
    
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    cabin.position.set(0, 1.6, -0.5); carGroup.add(cabin);

    const spotL = new THREE.SpotLight(0xffffaa, isDayMode ? 0 : 3, 30, 0.5, 0.5, 1);
    spotL.position.set(-0.8, 1, -2.5); spotL.target.position.set(-0.8, 0, -15);
    carGroup.add(spotL); carGroup.add(spotL.target); streetLights.push(spotL);
    
    const spotR = new THREE.SpotLight(0xffffaa, isDayMode ? 0 : 3, 30, 0.5, 0.5, 1);
    spotR.position.set(0.8, 1, -2.5); spotR.target.position.set(0.8, 0, -15);
    carGroup.add(spotR); carGroup.add(spotR.target); streetLights.push(spotR);

    const axis = Math.random() > 0.5 ? 'NS' : 'EW';
    const direction = Math.random() > 0.5 ? 1 : -1; 
    const laneOffset = 3.5 * direction; 

    if (axis === 'NS') {
        carGroup.position.set(laneOffset, 0, direction * 180);
        carGroup.rotation.y = direction === 1 ? Math.PI : 0;
    } else {
        carGroup.position.set(direction * 180, 0, -laneOffset);
        carGroup.rotation.y = direction === 1 ? Math.PI/2 : -Math.PI/2;
    }

    scene.add(carGroup);
    cars.push({ mesh: carGroup, speed: 0.8 + Math.random() * 0.4, axis: axis, dir: direction });
}

function emitSmoke(carMesh) {
    const smoke = new THREE.Mesh(smokeGeo, smokeMat.clone());
    const exhaustPos = new THREE.Vector3(0, 0.3, 2.5); 
    smoke.position.copy(carMesh.localToWorld(exhaustPos));
    scene.add(smoke);
    smokeParticles.push({ mesh: smoke, life: 1.0, riseSpeed: 0.1 });
}


// --- 5. التحكم والأنيميشن ---
let currentSysMode = 'Auto'; 
let isMisting = false;

window.setSysMode = function(mode) {
    currentSysMode = mode;
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    
    if(mode === 'Auto') {
        document.querySelector('.btn:nth-child(1)').classList.add('active');
        isMisting = false;
    } else if(mode === 'Irrigate') {
        document.querySelector('.btn:nth-child(2)').classList.add('active');
        isMisting = false;
    } else if(mode === 'Mist') {
        document.querySelector('.btn.emergency').classList.add('active');
        isMisting = true; 
    }
};

window.toggleDayNight = function() {
    isDayMode = !isDayMode;
    const btn = document.getElementById('day-night-btn');
    
    if(isDayMode) {
        scene.background = new THREE.Color(0x87CEEB); 
        scene.fog = new THREE.FogExp2(0x87CEEB, 0.004);
        ambientLight.intensity = 2.5; ambientLight.color.setHex(0xffffff);
        mainLight.intensity = 1.2; mainLight.color.setHex(0xffffff);
        
        windowsArray.forEach(w => w.color.setHex(0x111111)); 
        streetLights.forEach(l => l.intensity = 0); 
        
        btn.innerHTML = '<i class="fa-solid fa-moon"></i> Night Mode';
        btn.classList.add('active');
    } else {
        scene.background = new THREE.Color(0x020408);
        scene.fog = new THREE.FogExp2(0x020408, 0.007);
        ambientLight.intensity = 1.5; ambientLight.color.setHex(0x0a1525);
        mainLight.intensity = 0.8; mainLight.color.setHex(0x00F0FF);
        
        windowsArray.forEach(w => w.color.setHex(Math.random() > 0.7 ? 0x00F0FF : 0x020408));
        streetLights.forEach(l => l.intensity = 3);
        
        btn.innerHTML = '<i class="fa-solid fa-sun"></i> Morning Mode';
        btn.classList.remove('active');
    }
};

function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += 0.0005;

    if (isMisting || (currentSysMode === 'Auto' && Math.random() > 0.95)) {
        mistMat.opacity = 0.5;
        const positions = mistSystem.geometry.attributes.position.array;
        for(let i=1; i<mistParticles * 3; i+=3) {
            positions[i] -= 0.4; 
            if(positions[i] < 0) positions[i] = canopyHeight; 
        }
        mistSystem.geometry.attributes.position.needsUpdate = true;
    } else {
        mistMat.opacity -= 0.05;
        if(mistMat.opacity < 0) mistMat.opacity = 0;
    }

    if(Math.random() < 0.04 && cars.length < 15) spawnCar();
    
    cars.forEach((car, index) => {
        if (car.axis === 'NS') car.mesh.position.z -= car.speed * car.dir;
        else car.mesh.position.x -= car.speed * car.dir;
        
        if(Math.random() > 0.985) emitSmoke(car.mesh); // العربيات هتطلع دخان أقل بكتير

        if(Math.abs(car.mesh.position.z) > 200 || Math.abs(car.mesh.position.x) > 200) {
            scene.remove(car.mesh);
            cars.splice(index, 1);
        }
    });

    smokeParticles.forEach((p, index) => {
        p.mesh.position.y += p.riseSpeed; 
        p.mesh.scale.multiplyScalar(1.02); 
        
        if(p.mesh.position.y > canopyHeight - 2) {
            p.mesh.scale.multiplyScalar(0.5); 
            p.life -= 0.15;
        }
        
        p.mesh.material.opacity = p.life * (isDayMode ? 0.2 : 0.4);
        
        if(p.life <= 0) {
            scene.remove(p.mesh);
            smokeParticles.splice(index, 1);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// الداتا الوهمية
let mockData = { temp: 38.5, turbidity: 45.2, power: 120, moisture: 40, aqi: 75, uv: 8, humidity: 30, valveFlow: 0, mistPressure: 0 };

function updateMockData() {
    if (isMisting) {
        mockData.temp = Math.max(28.5, mockData.temp - 0.5); 
        mockData.mistPressure = 4.5 + (Math.random() * 0.5); 
        mockData.humidity = Math.min(65, mockData.humidity + 2); 
        mockData.aqi = Math.max(20, mockData.aqi - 2); 
    } else {
        mockData.temp = Math.min(41.0, mockData.temp + 0.2); 
        mockData.mistPressure = 0;
        mockData.humidity = Math.max(25, mockData.humidity - 0.5);
    }
    if (currentSysMode === 'Irrigate') {
        mockData.valveFlow = 2.5 + (Math.random() * 0.2);
        mockData.moisture = Math.min(95, mockData.moisture + 1.5);
    } else {
        mockData.valveFlow = 0;
        mockData.moisture = Math.max(30, mockData.moisture - 0.2);
    }

    if(document.getElementById('street_temp')) {
        document.getElementById('street_temp').innerHTML = mockData.temp.toFixed(1) + ' <small>°C</small>';
        const tempBubble = document.getElementById('temp_bubble');
        if(mockData.temp > 35) { tempBubble.style.background = '#ff4444'; tempBubble.style.boxShadow = '0 0 10px #ff4444'; }
        else { tempBubble.style.background = 'var(--accent-cyan)'; tempBubble.style.boxShadow = '0 0 10px var(--accent-cyan)'; }

        mockData.turbidity = Math.max(2.5, 45 - (Math.random() * 5)); 
        document.getElementById('water_purity').innerHTML = mockData.turbidity.toFixed(1) + ' <small>NTU</small>';
        document.getElementById('water_progress').style.width = Math.max(0, 100 - mockData.turbidity) + '%';
        
        mockData.power = 100 + Math.random() * 40;
        document.getElementById('system_power').innerHTML = mockData.power.toFixed(0) + ' <small>W</small>';
        document.getElementById('power_progress').style.width = (mockData.power / 150) * 100 + '%';

        document.getElementById('soil_moisture').innerText = mockData.moisture.toFixed(0);
        document.getElementById('moisture_circle').style.strokeDasharray = `${mockData.moisture}, 100`;

        document.getElementById('air_quality').innerText = mockData.aqi.toFixed(0);
        document.getElementById('aqi_circle').style.strokeDasharray = `${Math.min(100, mockData.aqi)}, 100`;

        document.getElementById('uv_index').innerText = mockData.uv.toFixed(1);
        document.getElementById('hum').innerText = mockData.humidity.toFixed(0);

        document.getElementById('valve_flow').innerText = mockData.valveFlow.toFixed(1);
        const valveStatus = document.getElementById('valve_status');
        const valveDot = document.getElementById('dot_valve');
        if (mockData.valveFlow > 0) {
            valveStatus.innerText = 'OPEN (WATERING)'; valveStatus.style.color = 'var(--accent-cyan)';
            valveDot.className = 'status-dot active'; valveDot.style.background = 'var(--accent-cyan)';
        } else {
            valveStatus.innerText = 'CLOSED'; valveStatus.style.color = '#ccc';
            valveDot.className = 'status-dot idle';
        }

        document.getElementById('mist_pressure').innerText = mockData.mistPressure.toFixed(1);
        const mistStatus = document.getElementById('mist_status');
        const mistDot = document.getElementById('dot_mist');
        if (mockData.mistPressure > 0) {
            mistStatus.innerText = 'PUMPING (COOLING)'; mistStatus.style.color = 'var(--accent-green)';
            mistDot.className = 'status-dot active';
        } else {
            mistStatus.innerText = 'STANDBY'; mistStatus.style.color = '#ccc';
            mistDot.className = 'status-dot idle';
        }
    }
// --- تحديث بيانات فيديو الـ AI (تتغير في رينج صغير جداً) ---
        
    // 1. دقة التعرف (من 98.0% لـ 99.5%)
        if(document.getElementById('ai-accuracy')) {
            let accuracy = 98.0 + (Math.random() * 1.5);
            document.getElementById('ai-accuracy').innerText = accuracy.toFixed(1) + '%';
        }

        // 2. توقعات المطر (من 10% لـ 14%)
        if(document.getElementById('liveRainProb')) {
            let rainProb = 10 + (Math.random() * 4);
            document.getElementById('liveRainProb').innerText = rainProb.toFixed(0) + '%';
        }

        // 3. صحة النبات NDVI (مؤشر صحة الزرع من 0.82 لـ 0.88 - بيقرأ كأنه ممتاز)
        if(document.getElementById('livePlantHealth')) {
            let health = 0.82 + (Math.random() * 0.06);
            document.getElementById('livePlantHealth').innerText = health.toFixed(2) + ' (Optimal)';
        }    
}
setInterval(updateMockData, 1000);

let loadProgress = 0;
const loadInterval = setInterval(() => {
    loadProgress += 2; 
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('loading-text');
    if(bar) bar.style.width = loadProgress + '%';
    if(txt) txt.innerText = loadProgress + '% LOADED';
    
    if(loadProgress >= 100) {
        clearInterval(loadInterval);
        const screen = document.getElementById('loading-screen');
        if(screen) { screen.style.opacity = '0'; setTimeout(() => { screen.style.display = 'none'; }, 1000); }
        animate();
    }
}, 30);