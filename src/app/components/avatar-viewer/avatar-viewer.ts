import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-avatar-viewer',
  imports: [],
  templateUrl: './avatar-viewer.html',
  styleUrl: './avatar-viewer.scss',
})
export class AvatarViewer implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef<HTMLDivElement>;

  private mixer?: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private modelMesh?: THREE.Mesh;
  private headBone?: THREE.Object3D;

  private mouthOpenIndex = -1;
  private smileIndex = -1;
  private eyeBlinkIndex = -1;

  private isSpeaking = false;
  private speechIntensity = 0;
  private isGlbLoading = true;
  private animationFrameId?: number;

  ngOnInit(): void {
    this.setupScene();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
  }

  /* ------------------------------------------------------------------ */
  /*  🌌  Scene Setup                                                   */
  /* ------------------------------------------------------------------ */
  private setupScene(): void {
    const container = this.rendererContainer.nativeElement;
    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    /* 🎥 Camera */
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2.5);

    /* 🧱 Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 0); // transparent
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    /* 🎮 Controls */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    /* 💡 Lighting */
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 5.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    scene.add(dirLight);

    /* ⬇️ Load GLB Model */
    const loader = new GLTFLoader();
    loader.load(
      '/glb_avatars/megan_female.glb', // ✅ from root /public/models/avatar.glb
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.2, 1.2, 1.2);

        // 👇 Make avatar lean slightly forward
        //model.rotation.x = -0.5;

        // Auto-ground: drop feet to bottom of view
        const bbox = new THREE.Box3().setFromObject(model);
        const footY = bbox.min.y;
        const fov = camera.fov * (Math.PI / 180);
        const cameraHeightInWorldUnits =
          2 * Math.tan(fov / 2) * camera.position.z;
        const bottomWorldY = -cameraHeightInWorldUnits / 2;
        model.position.y = bottomWorldY - footY;

        // Shadows
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = false;
          }
        });

        scene.add(model);

        /* 🪞 Ground shadow receiver */
        const planeGeo = new THREE.PlaneGeometry(10, 10);
        const planeMat = new THREE.ShadowMaterial({ opacity: 0.25 });
        const ground = new THREE.Mesh(planeGeo, planeMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = model.position.y + 0.2;
        ground.receiveShadow = true;
        scene.add(ground);

        /* 🎞 Animation setup */
        this.mixer = new THREE.AnimationMixer(model);
        if (gltf.animations.length > 0) {
          const idle =
            THREE.AnimationClip.findByName(gltf.animations, 'Idle') ||
            gltf.animations[0];
          this.mixer.clipAction(idle).play();
        }

        this.clock = new THREE.Clock();


        this.isGlbLoading = false;
      },
      undefined,
      (err) => console.error('Error loading GLB:', err)
    );

    /* 🔄 Animation Loop */
    let blinkCounter = 0;
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      if (this.mixer) this.mixer.update(delta);
      controls.update();

      // mouth open if speaking
      if (
        this.modelMesh?.morphTargetInfluences &&
        this.mouthOpenIndex !== -1
      ) {
        this.modelMesh.morphTargetInfluences[this.mouthOpenIndex] =
          this.isSpeaking ? this.speechIntensity : 0;
      }

      // blinking
      blinkCounter++;
      if (blinkCounter > 150 && this.modelMesh && this.eyeBlinkIndex !== -1) {
        const blink = Math.abs(Math.sin(Date.now() / 100));
        this.modelMesh.morphTargetInfluences![this.eyeBlinkIndex] = blink;
        if (blinkCounter > 160) blinkCounter = 0;
      }

      // subtle head motion
      if (this.headBone) {
        //this.headBone.rotation.x = this.isSpeaking ? Math.sin(Date.now() / 200) * 0.05 : 0;
        this.headBone.rotation.x = -0.15 + (this.isSpeaking ? Math.sin(Date.now() / 200) * 0.05 : 0);
      }
      

      renderer.render(scene, camera);
    };
    animate();

    /* 📐 Resize */
    this.onResize = () => {
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {};
}