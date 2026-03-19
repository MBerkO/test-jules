// --- AUDIO SYSTEM (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'kick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'goal') {
        // Seyirci uğultusu / alkış benzeri ses için birden fazla osilatör kullan
        for(let i=0; i<3; i++) {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(400 + (Math.random()*200), now);
            osc2.frequency.linearRampToValueAtTime(600 + (Math.random()*200), now + 0.5);
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.3, now + 0.2);
            gain2.gain.linearRampToValueAtTime(0, now + 1.5);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now);
            osc2.stop(now + 1.5);
        }

        // Başarı "ding" sesi
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1108.73, now + 0.1); // C#6
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
    else if (type === 'miss' || type === 'save') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
    else if (type === 'post') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// --- STATE & SETTINGS ---
const STATE = {
    score: 0,
    highScore: parseInt(localStorage.getItem('penaltyHighScore') || '0'),
    isShooting: false,
    hasScored: false,
    gameOver: false,
    resetting: false,
    difficulty: 1, // Kaleci hızı çarpanı
};

// --- DOM ELEMENTS ---
const uiCurrentScore = document.getElementById('current-score');
const uiHighScore = document.getElementById('high-score');
const uiMessageContainer = document.getElementById('message-container');
const uiGameMessage = document.getElementById('game-message');
const uiGameSubMessage = document.getElementById('game-submessage');
const gameContainer = document.getElementById('game-container');

uiHighScore.textContent = STATE.highScore;

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
scene.background = new THREE.Color(isDarkMode ? 0x1a237e : 0x81d4fa); // Koyu lacivert veya açık mavi gökyüzü

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 12); // Oyuncunun göz hizası, topun biraz arkasında

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
gameContainer.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// --- MATERIALS ---
const fieldMat = new THREE.MeshStandardMaterial({ color: isDarkMode ? 0x1b5e20 : 0x4caf50 }); // Çim yeşili
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Çizgiler, direkler
const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Top (daha sonra doku eklenebilir)
const gkMat = new THREE.MeshStandardMaterial({ color: 0xf44336 }); // Kaleci (kırmızı)

// --- OBJECTS ---
// 1. Saha (Field)
const fieldGeo = new THREE.PlaneGeometry(50, 50);
const field = new THREE.Mesh(fieldGeo, fieldMat);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true;
scene.add(field);

// 2. Kale (Goal)
const goalGroup = new THREE.Group();
const postRadius = 0.1;
const postHeight = 2.44; // Gerçek ölçüler (metre)
const goalWidth = 7.32;
const goalDepth = 2.0;

const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
const crossbarGeo = new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 16);

// Sol Direk
const leftPost = new THREE.Mesh(postGeo, whiteMat);
leftPost.position.set(-goalWidth/2, postHeight/2, 0);
leftPost.castShadow = true;
goalGroup.add(leftPost);

// Sağ Direk
const rightPost = new THREE.Mesh(postGeo, whiteMat);
rightPost.position.set(goalWidth/2, postHeight/2, 0);
rightPost.castShadow = true;
goalGroup.add(rightPost);

// Üst Direk
const crossbar = new THREE.Mesh(crossbarGeo, whiteMat);
crossbar.rotation.z = Math.PI / 2;
crossbar.position.set(0, postHeight, 0);
crossbar.castShadow = true;
goalGroup.add(crossbar);

goalGroup.position.set(0, 0, -10); // Kaleyi geriye al
scene.add(goalGroup);

// 3. Kaleci (Goalkeeper)
const gkWidth = 0.6;
const gkHeight = 1.8;
const gkGeo = new THREE.BoxGeometry(gkWidth, gkHeight, 0.2);
const goalkeeper = new THREE.Mesh(gkGeo, gkMat);
goalkeeper.position.set(0, gkHeight/2, -9.8); // Kalenin hemen önünde
goalkeeper.castShadow = true;
scene.add(goalkeeper);

// 4. Top (Ball)
const ballRadius = 0.22;
const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.castShadow = true;
scene.add(ball);

// Top Fiziği (Basit Euler Entegrasyonu)
const ballPhysics = {
    position: new THREE.Vector3(0, ballRadius, 0), // Penaltı noktası (0,0)
    velocity: new THREE.Vector3(0, 0, 0),
    gravity: -9.8,
    spin: 0, // Falso
    radius: ballRadius
};
ball.position.copy(ballPhysics.position);

// Kaleci YZ Durumu
const gkAI = {
    targetX: 0,
    speed: 0.05,
    isDiving: false
};

// --- INPUT HANDLING (SWIPE) ---
let touchStart = null;
let touchTime = 0;

function handleStart(e) {
    if (STATE.isShooting || STATE.resetting) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    touchStart = { x: clientX, y: clientY };
    touchTime = Date.now();
    uiMessageContainer.classList.add('fade-out');
}

function handleEnd(e) {
    if (!touchStart || STATE.isShooting || STATE.resetting) return;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

    const dx = clientX - touchStart.x;
    const dy = clientY - touchStart.y;
    const dt = (Date.now() - touchTime) / 1000; // Saniye cinsinden

    touchStart = null;

    // Minimum swipe mesafesi ve yön kontrolü (yukarı doğru olmalı)
    if (dy > -50) return; // Yeterince yukarı kaydırılmadı

    // Swipe hızı
    let speedZ = Math.min(-dy / (dt * 100), -15); // İleri hız (Z ekseninde negatif)
    let speedY = Math.min(-dy / (dt * 200), 8);  // Havalanma hızı
    let speedX = dx / (dt * 100);                // Sağa/sola gidiş

    // Falso (Spin) hesaplama: Eğer dx (sağa sola hareket) varsa, falso ver.
    let spin = dx * 0.02; // Sağ/sol eğim kadar falso

    shoot(speedX, speedY, speedZ, spin);
}

document.addEventListener('touchstart', handleStart, {passive: false});
document.addEventListener('touchend', handleEnd, {passive: false});
document.addEventListener('mousedown', handleStart);
document.addEventListener('mouseup', handleEnd);


// --- GAME LOGIC ---
function shoot(vx, vy, vz, spin) {
    STATE.isShooting = true;
    STATE.gameOver = false;
    STATE.hasScored = false;

    ballPhysics.velocity.set(vx, vy, vz);
    ballPhysics.spin = spin;

    // Ses çal: Vuruş
    playSound('kick');

    // Kaleciyi tetikle (Topun tahmini varış noktasına göre)
    // Basit tahmin: topun Z si -10 olduğunda X i nerede olacak?
    const timeToGoal = Math.abs((-10 - ballPhysics.position.z) / vz);
    let predictedX = ballPhysics.position.x + (vx * timeToGoal) + (spin * timeToGoal * timeToGoal * 0.5); // spin bir nevi yatay ivme gibi davranacak

    // Kaleci kararı (Zorluğa göre sapma eklenebilir)
    gkAI.targetX = Math.max(-goalWidth/2 + gkWidth/2, Math.min(goalWidth/2 - gkWidth/2, predictedX));
    gkAI.isDiving = true;
    // Zorluk arttıkça kaleci daha hızlı tepki verir
    gkAI.speed = 0.05 + (STATE.difficulty * 0.01);
}

function resetGame() {
    STATE.resetting = true;

    setTimeout(() => {
        // Topu sıfırla
        ballPhysics.position.set(0, ballRadius, 0);
        ballPhysics.velocity.set(0, 0, 0);
        ballPhysics.spin = 0;
        ball.position.copy(ballPhysics.position);

        // Kaleciyi sıfırla
        goalkeeper.position.set(0, gkHeight/2, -9.8);
        gkAI.isDiving = false;
        gkAI.targetX = 0;

        STATE.isShooting = false;
        STATE.hasScored = false;
        STATE.gameOver = false;
        STATE.resetting = false;

        uiMessageContainer.classList.remove('fade-out');
        if (STATE.score > 0) {
            uiGameMessage.textContent = 'DEVAM ET';
            uiGameSubMessage.textContent = 'Seriyi bozma!';
        } else {
            uiGameMessage.textContent = 'KAYDIR (SWIPE)';
            uiGameSubMessage.textContent = 'Şut çekmek için ekranı yukarı doğru kaydır';
        }
        uiGameMessage.className = ''; // Renkleri temizle

    }, 2000); // 2 saniye sonra yenile
}

function handleResult(result) {
    if (STATE.gameOver) return;
    STATE.gameOver = true;

    if (result === 'goal') {
        STATE.score++;
        STATE.difficulty++;
        uiCurrentScore.textContent = STATE.score;
        if (STATE.score > STATE.highScore) {
            STATE.highScore = STATE.score;
            localStorage.setItem('penaltyHighScore', STATE.highScore);
            uiHighScore.textContent = STATE.highScore;
        }
        uiGameMessage.textContent = 'GOL!';
        uiGameMessage.className = 'text-success';
        uiGameSubMessage.textContent = 'Harika şut!';
        playSound('goal');
    } else {
        STATE.score = 0;
        STATE.difficulty = 1;
        uiCurrentScore.textContent = STATE.score;
        uiGameMessage.textContent = result === 'save' ? 'KURTARDI!' : 'KAÇTI!';
        uiGameMessage.className = 'text-danger';
        uiGameSubMessage.textContent = 'Tekrar dene.';
        playSound(result === 'save' ? 'save' : 'miss');
    }

    uiMessageContainer.classList.remove('fade-out');
    resetGame();
}

function checkCollisions() {
    if (STATE.gameOver) return;

    const bx = ball.position.x;
    const by = ball.position.y;
    const bz = ball.position.z;

    // 1. Kale Çizgisini Geçti Mi? (Gol Kontrolü)
    if (bz < -10) {
        // Çerçeveyi buldu mu?
        if (by > 0 && by < postHeight && bx > -goalWidth/2 && bx < goalWidth/2) {
            handleResult('goal');
        } else {
            // Çizgiyi geçti ama çerçevenin dışında
            handleResult('miss');
        }
        return;
    }

    // 2. Kaleci ile Çarpışma
    // Kalecinin Hitbox'ı (biraz geniş tutalım)
    const gx = goalkeeper.position.x;
    const gy = goalkeeper.position.y;
    const gz = goalkeeper.position.z;

    if (Math.abs(bx - gx) < (gkWidth/2 + ballRadius) &&
        Math.abs(by - gy) < (gkHeight/2 + ballRadius) &&
        Math.abs(bz - gz) < (0.1 + ballRadius)) {

        // Çarpma tepkisi (top seker)
        ballPhysics.velocity.z *= -0.5;
        ballPhysics.velocity.x += (Math.random() - 0.5) * 5;
        handleResult('save');
        return;
    }

    // 3. Direklerle Çarpışma
    // Z ekseninde kale çizgisine çok yakınsa
    if (Math.abs(bz - (-10)) < ballRadius * 2) {
        // Sol direk
        if (Math.abs(bx - (-goalWidth/2)) < (postRadius + ballRadius) && by < postHeight) {
            ballPhysics.velocity.z *= -0.5;
            ballPhysics.velocity.x *= -0.8;
            playSound('post');
            handleResult('miss'); // Direkten döndü
            return;
        }
        // Sağ direk
        if (Math.abs(bx - (goalWidth/2)) < (postRadius + ballRadius) && by < postHeight) {
            ballPhysics.velocity.z *= -0.5;
            ballPhysics.velocity.x *= -0.8;
            playSound('post');
            handleResult('miss');
            return;
        }
        // Üst direk
        if (Math.abs(by - postHeight) < (postRadius + ballRadius) && Math.abs(bx) < goalWidth/2) {
            ballPhysics.velocity.z *= -0.5;
            ballPhysics.velocity.y *= -0.8;
            playSound('post');
            handleResult('miss');
            return;
        }
    }
}


// --- MAIN LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1); // Limit dt to prevent huge jumps

    if (STATE.isShooting) {
        // Top Fiziğini Güncelle
        // Yerçekimi
        ballPhysics.velocity.y += ballPhysics.gravity * dt;

        // Falso (Magnus efekti simülasyonu - hızın x bileşenine etki eder)
        ballPhysics.velocity.x += ballPhysics.spin * dt * 50;

        // Hava sürtünmesi (çok hafif)
        ballPhysics.velocity.multiplyScalar(0.99);

        // Pozisyonu güncelle
        ballPhysics.position.addScaledVector(ballPhysics.velocity, dt);

        // Zeminle çarpışma (Sekme)
        if (ballPhysics.position.y < ballRadius) {
            ballPhysics.position.y = ballRadius;
            ballPhysics.velocity.y *= -0.6; // Enerji kaybı
            ballPhysics.velocity.x *= 0.8; // Sürtünme
            ballPhysics.velocity.z *= 0.8;
        }

        ball.position.copy(ballPhysics.position);

        // Topun dönüşü (görsellik için, doku eklendiğinde daha belli olur)
        ball.rotation.x += ballPhysics.velocity.z * dt;
        ball.rotation.y += ballPhysics.velocity.x * dt;

        // Kaleci YZ Güncelle
        if (gkAI.isDiving && !STATE.gameOver) {
            // Kaleci hedefe doğru hareket etsin
            const dx = gkAI.targetX - goalkeeper.position.x;
            if (Math.abs(dx) > 0.1) {
                goalkeeper.position.x += Math.sign(dx) * gkAI.speed * (dt * 60); // frame bağımsız hız
            }
        }

        checkCollisions();
    }

    renderer.render(scene, camera);
}

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
