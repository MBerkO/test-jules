import * as THREE from '../js/three.min.js';

export class Arena {
    constructor() {
        this.mesh = new THREE.Group();
        this.buildArena();
    }

    buildArena() {
        // Stadyum zemin rengi
        const arenaMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Duvar rengi
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.5,
            metalness: 0.2,
            transparent: true,
            opacity: 0.8
        });

        const arenaRadius = 15;
        const arenaDepth = 3;

        // İçbükey zemin (Küre segmenti)
        // Yarıçap, genişlik segmenti, yükseklik segmenti, phi start, phi length, theta start, theta length
        const groundGeo = new THREE.SphereGeometry(arenaRadius * 2, 64, 32, 0, Math.PI * 2, Math.PI - 0.2, 0.2);
        const ground = new THREE.Mesh(groundGeo, arenaMaterial);
        // Kürenin alt kısmını yukarı bakacak şekilde ayarlayalım
        ground.position.y = arenaRadius * 2 - arenaDepth;
        this.mesh.add(ground);

        // Kenar Duvarları
        const wallGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius, 4, 64, 1, true);
        const wall = new THREE.Mesh(wallGeo, wallMaterial);
        wall.position.y = 1;
        this.mesh.add(wall);

        // Zemin altı dekoratif kaplama
        const floorGeo = new THREE.CylinderGeometry(arenaRadius + 0.5, arenaRadius + 0.5, 4.5, 64);
        const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        floor.position.y = -0.25;
        this.mesh.add(floor);
    }
}