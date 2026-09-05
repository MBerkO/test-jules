import * as THREE from '../js/three.min.js';

export class DragoonV2 {
    constructor() {
        this.mesh = new THREE.Group();
        this.buildModel();
    }

    buildModel() {
        // Dragoon V2 özellikleri
        // Renkler: Beyaz ağırlıklı, kırmızı ve mavi detaylar

        const whiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.4,
            metalness: 0.3
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.2,
            metalness: 0.8
        });

        const redMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            roughness: 0.3,
            metalness: 0.1
        });

        const blueMaterial = new THREE.MeshStandardMaterial({
            color: 0x0000cc,
            roughness: 0.3,
            metalness: 0.1
        });

        // 1. Bit Chip (Orta kısımdaki ikonik parça)
        const bitChipGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32);
        const bitChip = new THREE.Mesh(bitChipGeo, whiteMaterial);
        bitChip.position.y = 1.0;

        // Bit Chip üzerindeki kırmızı detay (Dragoon sembolünü temsilen)
        const bitChipDetailGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.22, 32);
        const bitChipDetail = new THREE.Mesh(bitChipDetailGeo, redMaterial);
        bitChipDetail.position.y = 1.0;
        this.mesh.add(bitChip);
        this.mesh.add(bitChipDetail);

        // 2. Attack Ring (Saldırı Halkası) - Sola dönen, ters tırtıklı yapı
        const attackRingGroup = new THREE.Group();

        // Ana Halka
        const attackRingGeo = new THREE.TorusGeometry(1.5, 0.5, 16, 32);
        const attackRing = new THREE.Mesh(attackRingGeo, whiteMaterial);
        attackRing.rotation.x = Math.PI / 2;
        attackRingGroup.add(attackRing);

        // Saldırı çıkıntıları (Dragoon'un ters dönen dişleri)
        for (let i = 0; i < 4; i++) {
            const spikeGeo = new THREE.BoxGeometry(0.6, 0.4, 1.2);
            // Sola dönen bir bıçak efekti vermek için şekli biraz bozuyoruz
            const positionAttribute = spikeGeo.attributes.position;
            for(let j = 0; j < positionAttribute.count; j++) {
                const x = positionAttribute.getX(j);
                const y = positionAttribute.getY(j);
                const z = positionAttribute.getZ(j);

                if (z > 0 && x > 0) {
                    positionAttribute.setX(j, x + 0.3); // sivrilik
                }
            }
            spikeGeo.computeVertexNormals();

            const spike = new THREE.Mesh(spikeGeo, whiteMaterial);
            const angle = (i * Math.PI) / 2;

            // Çıkıntıların yerleşimi
            spike.position.x = Math.cos(angle) * 1.8;
            spike.position.z = Math.sin(angle) * 1.8;
            spike.rotation.y = -angle + (Math.PI / 6); // Sola dönüş için eğim

            attackRingGroup.add(spike);

            // Mavi detaylar
            const detailGeo = new THREE.BoxGeometry(0.2, 0.45, 0.5);
            const detail = new THREE.Mesh(detailGeo, blueMaterial);
            detail.position.x = Math.cos(angle) * 1.5;
            detail.position.z = Math.sin(angle) * 1.5;
            detail.rotation.y = -angle;
            attackRingGroup.add(detail);
        }

        attackRingGroup.position.y = 0.6;
        this.mesh.add(attackRingGroup);

        // 3. Weight Disk (Ağırlık Diski) - Metalik sekizgen
        const weightDiskGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.3, 8);
        const weightDisk = new THREE.Mesh(weightDiskGeo, metalMaterial);
        weightDisk.position.y = 0.2;
        this.mesh.add(weightDisk);

        // 4. Spin Gear (Dönüş Dişlisi)
        const spinGearGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
        const spinGear = new THREE.Mesh(spinGearGeo, whiteMaterial);
        spinGear.position.y = -0.1;
        this.mesh.add(spinGear);

        // 5. Blade Base (Taban)
        const baseGeo = new THREE.CylinderGeometry(1.2, 0.4, 0.8, 16);
        const base = new THREE.Mesh(baseGeo, whiteMaterial);
        base.position.y = -0.5;
        this.mesh.add(base);

        // Flat tip (Düz uç - Saldırı tiplerine özgü hareketli yapı)
        const tipGeo = new THREE.CylinderGeometry(0.4, 0.2, 0.2, 16);
        const tip = new THREE.Mesh(tipGeo, metalMaterial);
        tip.position.y = -0.9;
        this.mesh.add(tip);
    }
}