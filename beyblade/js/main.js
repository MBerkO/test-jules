import * as THREE from '../js/three.min.js';
import * as CANNON from '../js/cannon-es.js';
import { DragoonV2 } from './DragoonV2.js';
import { Arena } from './Arena.js';

class GameEngine {
    constructor() {
        this.initThree();
        this.initCannon();
        this.createScene();
        this.setupEventListeners();

        this.clock = new THREE.Clock();
        this.beybladeBody = null;
        this.beybladeMesh = null;
        this.isSpinning = false;

        this.animate();
    }

    initThree() {
        this.container = document.getElementById('canvas-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(
            window.matchMedia('(prefers-color-scheme: dark)').matches ? 0x121212 : 0xf5f5f5
        );

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Zeminin altına inmeyi engelle

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Tema değişikliğini dinle
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.scene.background = new THREE.Color(e.matches ? 0x121212 : 0xf5f5f5);
        });
    }

    initCannon() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0), // Yerçekimi
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;

        // Materyaller
        this.physicsMaterial = new CANNON.Material('standard');
        const physicsContactMaterial = new CANNON.ContactMaterial(
            this.physicsMaterial,
            this.physicsMaterial,
            {
                friction: 0.1,    // Sürtünme
                restitution: 0.6  // Sıçrama
            }
        );
        this.world.addContactMaterial(physicsContactMaterial);
    }

    createScene() {
        // 1. Arena (Görsel ve Fizik)
        const arena = new Arena();
        this.scene.add(arena.mesh);

        // Arena Fizik Bedeni (Basit bir zemin olarak modelliyoruz, içbükeylik Cannon'da trimesh ile yapılabilir ama performans için şimdilik silindir/plane karışımı veya sadece plane)
        // Gerçekçi içbükey fizik için Trimesh kullanalım
        this.createArenaPhysics();

        // 2. Beyblade (Görsel ve Fizik)
        const dragoon = new DragoonV2();
        this.beybladeMesh = dragoon.mesh;
        this.beybladeMesh.position.set(0, 10, 0); // Fırlatma yüksekliği
        this.scene.add(this.beybladeMesh);

        // Beyblade Fizik Bedeni
        const radius = 1.6; // Maksimum yarıçap
        const height = 2.0; // Toplam yükseklik

        // Daha dengeli dönüş için silindir kullanıyoruz
        const beybladeShape = new CANNON.Cylinder(radius, 0.2, height, 16);

        this.beybladeBody = new CANNON.Body({
            mass: 0.5, // 50 gram gibi düşünülebilir (Cannon kg cinsinden hesaplar, oranı koruyoruz)
            material: this.physicsMaterial,
            shape: beybladeShape,
            position: new CANNON.Vec3(0, 10, 0)
        });

        // Ağırlık merkezini aşağı çekmek dengeli dönmeyi sağlar
        // Cannon'da silindirin merkezi ortadadır.

        // Dönüşü engellememek için açısal sönümlemeyi (angular damping) düşük tutuyoruz
        this.beybladeBody.angularDamping = 0.1;
        this.beybladeBody.linearDamping = 0.1;

        this.world.addBody(this.beybladeBody);
    }

    createArenaPhysics() {
        // Basitleştirilmiş Arena Fiziği
        // Gerçek içbükey arenayı Cannon'da simüle etmek zordur. Şimdilik hafif eğimli düzlemler veya dev bir kürenin içi gibi davranacak bir yapı kuruyoruz.

        // 1. Düz zemin
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Statik
            material: this.physicsMaterial
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        groundBody.position.y = 0;
        this.world.addBody(groundBody);

        // 2. Eğimli Duvarlar (Basit yaklaşım)
        const numWalls = 8;
        const angleStep = (Math.PI * 2) / numWalls;
        const radius = 14;

        for (let i = 0; i < numWalls; i++) {
            const wallShape = new CANNON.Box(new CANNON.Vec3(10, 2, 1));
            const wallBody = new CANNON.Body({
                mass: 0,
                material: this.physicsMaterial
            });
            wallBody.addShape(wallShape);

            const angle = i * angleStep;
            wallBody.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);

            // Duvarı merkeze döndür ve hafif içe eğ (çanak yapısı)
            wallBody.quaternion.setFromEuler(0.2, -angle + Math.PI/2, 0, 'YXZ');

            this.world.addBody(wallBody);
        }
    }

    setupEventListeners() {
        const btnLetItRip = document.getElementById('btn-letitrip');
        const btnReset = document.getElementById('btn-reset');

        btnLetItRip.addEventListener('click', () => this.letItRip());
        btnReset.addEventListener('click', () => this.resetSimulation());
    }

    letItRip() {
        if (this.isSpinning) return;

        this.resetSimulation();
        this.isSpinning = true;

        // Fırlatma pozisyonu
        this.beybladeBody.position.set(2, 5, 2);

        // Hafif bir açı ver
        this.beybladeBody.quaternion.setFromEuler(0.1, 0, 0.1);

        // Hız ver (Aşağı ve merkeze doğru)
        this.beybladeBody.velocity.set(-2, -5, -2);

        // Dragoon V2 sola döner (Left Spin)
        // Y ekseninde yüksek bir açısal hız (angular velocity)
        const spinSpeed = 100;
        this.beybladeBody.angularVelocity.set(0, spinSpeed, 0);
    }

    resetSimulation() {
        this.isSpinning = false;

        // Başlangıç noktasına al
        this.beybladeBody.position.set(0, 10, 0);
        this.beybladeBody.velocity.set(0, 0, 0);
        this.beybladeBody.angularVelocity.set(0, 0, 0);
        this.beybladeBody.quaternion.setFromEuler(0, 0, 0);

        // Fiziği uyandır
        this.beybladeBody.wakeUp();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const dt = this.clock.getDelta();

        // Fizik adımı
        this.world.step(1 / 60, dt, 3);

        // Fizik sonuçlarını 3D modele aktar
        if (this.beybladeMesh && this.beybladeBody) {
            this.beybladeMesh.position.copy(this.beybladeBody.position);
            this.beybladeMesh.quaternion.copy(this.beybladeBody.quaternion);

            // Dönüş bitiyorsa
            if (this.isSpinning && this.beybladeBody.angularVelocity.length() < 1) {
                this.isSpinning = false;
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Uygulamayı başlat
window.addEventListener('DOMContentLoaded', () => {
    new GameEngine();
});