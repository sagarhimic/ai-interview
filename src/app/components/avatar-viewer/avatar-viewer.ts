import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

@Component({
  selector: 'app-avatar-viewer',
  standalone: true,
  templateUrl: './avatar-viewer.html',
  styleUrl: './avatar-viewer.scss',
})
export class AvatarViewer implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private clock = new THREE.Clock();
  private animationFrameId?: number;

  private morphMeshes: THREE.Mesh[] = [];
  private headBone?: THREE.Object3D;
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private isSpeaking = false;
  private isLoaded = false;

  ngOnInit() {
    this.initScene();
    this.loadAvatar();
    this.animate();
  }
  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId!);
    window.removeEventListener('resize', this.onResize);
    this.audioCtx?.close();
  }

  /* ------------------------------------------------------------------ */
  /* 🔧 SCENE SETUP                                                    */
  /* ------------------------------------------------------------------ */
  private initScene() {
    const container = this.rendererContainer.nativeElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 2.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    this.scene.add(hemi, dir);

    window.addEventListener('resize', this.onResize);
  }

  /* ------------------------------------------------------------------ */
  /* 👩‍💼 LOAD AVATAR                                                  */
  /* ------------------------------------------------------------------ */
  private loadAvatar() {
    const loader = new GLTFLoader();
    loader.load(
      '/glb_avatars/brunette.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2.5, 2.5, 2.5);

        const bbox = new THREE.Box3().setFromObject(model);
        const footY = bbox.min.y;
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraHeight = 2 * Math.tan(fov / 2) * this.camera.position.z;
        const bottomY = -cameraHeight / 2;
        model.position.y = bottomY - footY - 2.5;

        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const mesh = c as THREE.Mesh;
            mesh.castShadow = true;
            if (mesh.morphTargetDictionary) this.morphMeshes.push(mesh);
          }
          if (c.name === 'Head') this.headBone = c;
        });

        this.scene.add(model);
        this.isLoaded = true;


        // 🌬️ Subtle idle motion using GSAP
        gsap.to(model.position, {
          y: model.position.y + 0.05, // gentle breathing rise
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        });

        // 💁 Head idle tilt / micro nod
        model.traverse((obj) => {
          if (obj.type === 'Bone' && (obj.name.toLowerCase().includes('head') || obj.name.toLowerCase().includes('neck'))) {
            gsap.to(obj.rotation, {
              x: "+=0.03",
              y: "+=0.02",
              duration: 3,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          }
        });

        // 🤲 Slight hand sway (like balancing posture)
        model.traverse((obj) => {
          const n = obj.name.toLowerCase();
          if (obj.type === 'Bone' && (n.includes('forearm') || n.includes('hand'))) {
            gsap.to(obj.rotation, {
              z: (n.includes('left') ? "+=0.05" : "-=0.05"),
              duration: 2.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          }
        });

        // 💫 Tiny torso sway — natural standing balance
        model.traverse((obj) => {
          if (obj.type === 'Bone' && (obj.name.toLowerCase().includes('spine') || obj.name.toLowerCase().includes('chest'))) {
            gsap.to(obj.rotation, {
              y: "+=0.02",
              x: "+=0.01",
              duration: 4,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          }
        });

        // 🤖 Bring arms closer to body
        model.traverse((obj) => {
          if (obj.type === 'Bone') {
            const name = obj.name.toLowerCase();

            // Left Arm
            if (name.includes('arm_l') || name.includes('leftarm') || name.includes('upperarm_l') || name.includes('mixamorigleftarm')) {
              obj.rotation.z = THREE.MathUtils.degToRad(-20); // inward tilt
              obj.rotation.x = THREE.MathUtils.degToRad(68);  // slight down
            }

            // Right Arm
            if (name.includes('arm_r') || name.includes('rightarm') || name.includes('upperarm_r') || name.includes('mixamorigrightarm')) {
              obj.rotation.z = THREE.MathUtils.degToRad(20);  // inward tilt
              obj.rotation.x = THREE.MathUtils.degToRad(68);  // slight down
            }
          }
        });

        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.ShadowMaterial({ opacity: 0.25 })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = model.position.y + 0.2;
        plane.receiveShadow = true;
        this.scene.add(plane);
      },
      undefined,
      (err) => console.error('Error loading GLB:', err)
    );
  }

  /* ------------------------------------------------------------------ */
  /* 🔄 ANIMATION LOOP                                                 */
  /* ------------------------------------------------------------------ */
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();

    if (this.isLoaded) this.runIdleExpressions();
    this.renderer.render(this.scene, this.camera);
  };

  /* ------------------------------------------------------------------ */
  /* 💤 IDLE EXPRESSIONS (Blink, Smile, Brow Motion)                    */
  /* ------------------------------------------------------------------ */
  private runIdleExpressions() {
    const t = performance.now();

    // 👁️ Blinking
    const blink = Math.abs(Math.sin(t / 500)) > 0.98 ? 1 : 0;
    this.setMorph('eyeBlinkLeft', blink);
    this.setMorph('eyeBlinkRight', blink);

    // 😊 Soft smile
    this.setMorph('mouthSmileLeft', 0.25);
    this.setMorph('mouthSmileRight', 0.25);

    // 🤨 Gentle brow motion
    const brow = (Math.sin(t / 2000) + 1) / 10;
    this.setMorph('browInnerUp', brow);
  }

  /* ------------------------------------------------------------------ */
  /* 🗣️ ASK QUESTION + LIP SYNC + HEAD NOD                             */
  /* ------------------------------------------------------------------ */
  async askQuestion(audioUrl: string) {
    try {
      const audio = new Audio(audioUrl);
      this.audioCtx = new AudioContext();
      const src = this.audioCtx.createMediaElementSource(audio);
      this.analyser = this.audioCtx.createAnalyser();
      src.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      const data = new Uint8Array(this.analyser.fftSize);
      this.isSpeaking = true;
      audio.play();

      const loop = () => {
        if (!this.analyser) return;

        this.analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(
          data.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / data.length
        );
        this.updateLipSync(rms);

        if (!audio.paused && !audio.ended) {
          requestAnimationFrame(loop);
        } else {
          this.updateLipSync(0);
          this.isSpeaking = false;
        }
      };
      loop();
    } catch (err) {
      console.error('Error playing question audio:', err);
    }
  }

  private updateLipSync(rms: number) {
    const intensity = Math.min(1, rms * 6);

    // Mouth movement
    this.setMorph('jawOpen', intensity);
    this.setMorph('viseme_aa', intensity * 0.8);
    this.setMorph('viseme_O', intensity * 0.4);
    this.setMorph('viseme_I', intensity * 0.3);

    // Head nod motion (adds realism)
    if (this.headBone) {
      const nod = Math.sin(performance.now() / 200) * 0.05 * intensity;
      this.headBone.rotation.x = -0.1 + nod;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 🎭 EXPRESSION PRESETS (emotion styles)                             */
  /* ------------------------------------------------------------------ */
  private expressions: Record<string, Record<string, number>> = {
    neutral: { mouthSmileLeft: 0.2, mouthSmileRight: 0.2, browInnerUp: 0 },
    happy: { mouthSmileLeft: 0.7, mouthSmileRight: 0.7, browInnerUp: 0.3 },
    surprised: { jawOpen: 0.6, browInnerUp: 0.8, eyeWideLeft: 0.7, eyeWideRight: 0.7 },
    thinking: {
      browDownLeft: 0.4,
      browDownRight: 0.4,
      mouthFrownLeft: 0.2,
      mouthFrownRight: 0.2,
    },
    listening: {
      browInnerUp: 0.15,
      mouthSmileLeft: 0.3,
      mouthSmileRight: 0.3,
      jawOpen: 0.1,
    },
  };

  applyExpression(name: string) {
    const expr = this.expressions[name];
    if (!expr) return;

    Object.entries(expr).forEach(([key, value]) => {
      gsap.to({}, {
        duration: 0.4,
        onUpdate: () => this.setMorph(key, value),
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 🧠 MORPH TARGET CONTROL                                           */
  /* ------------------------------------------------------------------ */
  private setMorph(name: string, value: number) {
    for (const mesh of this.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences!;
      if (dict && name in dict) infl[dict[name]] = value;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 📐 RESIZE HANDLER                                                 */
  /* ------------------------------------------------------------------ */
  private onResize = () => {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };





private async initVoices(): Promise<void> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      resolve();
    } else {
      window.speechSynthesis.onvoiceschanged = () => resolve();
    }
  });
}








ngAfterViewInit() {
  // 👇 Create an invisible click area just for Chrome unlock
  const fakeButton = document.createElement('button');
  fakeButton.style.position = 'absolute';
  fakeButton.style.opacity = '0';
  fakeButton.style.pointerEvents = 'none';
  fakeButton.style.width = '1px';
  fakeButton.style.height = '1px';
  document.body.appendChild(fakeButton);

  const unlockAudio = () => {
    try {
      // ✅ Trigger a silent utterance to unlock SpeechSynthesis
      const testUtterance = new SpeechSynthesisUtterance(' ');
      window.speechSynthesis.speak(testUtterance);

      // ✅ Also unlock Web Audio for avatar animations
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dummy = ctx.createBufferSource();
      dummy.buffer = ctx.createBuffer(1, 1, 22050);
      dummy.connect(ctx.destination);
      dummy.start(0);
      ctx.resume();
    } catch (e) {
      console.warn('🔈 Audio unlock failed silently:', e);
    }
    console.log('✅ Audio & speech unlocked');
    fakeButton.remove();
    document.removeEventListener('mousedown', unlockAudio);
  };

  // 🧠 Listen for *any* first user gesture
  document.addEventListener('mousedown', unlockAudio, { once: true });

  // 🕒 Fallback: simulate a click after small delay (if allowed)
  setTimeout(() => {
    fakeButton.click();
  }, 1000);
}


}