import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Interviews } from '../core/_services/Interviews';
import { Token } from '../core/_services/token';

@Component({
  selector: 'app-inverview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './inverview.html',
  styleUrl: './inverview.scss',
})
export class Inverview implements OnInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;

  setupForm!: FormGroup;
  questions: { id: number; question: string }[] = [];
  currentIndex = 0;

  loadingGenerate = false;
  loadingSubmit = false;

  candidateId = 5;
  user_info: any;

  // Camera + voice vars
  stream: MediaStream | null = null;
  frameInterval: any = null;
  recognition: any;
  recording = false;
  interimTranscript = '';
  finalTranscript = '';

  constructor(
    private fb: FormBuilder,
    private svc: Interviews,
    private ngZone: NgZone,
    private _token: Token
  ) {}

  ngOnInit(): void {
    this.user_info = this._token.getUserData();
    this.setupForm = this.fb.group({
      job_title: [this.user_info?.data?.job_title],
      job_description: [this.user_info?.data?.job_description],
      duration: [this.user_info?.data?.duration, [Validators.required]],
      experience: [this.user_info?.data?.experience, [Validators.required]],
      required_skills: [this.user_info?.data?.required_skills, [Validators.required]],
      candidate_skills: [this.user_info?.data?.candidate_skills, [Validators.required]],
    });
  }

  // ✅ Generate questions & start camera + voice
  generateQuestions() {
    if (this.setupForm.invalid) return;
    this.loadingGenerate = true;

    const formData = new FormData();
    const payload = this.setupForm.value;
    Object.keys(payload).forEach((k) => formData.append(k, payload[k]));

    this.svc.generateQuestions(formData).subscribe({
      next: async (res: any) => {
        this.loadingGenerate = false;
        this.questions = Array.isArray(res.questions) ? res.questions : [];
        this.currentIndex = 0;

        // ✅ Start camera only when questions loaded
        await this.startCamera();
      },
      error: (err) => {
        console.error(err);
        this.loadingGenerate = false;
        alert('Error generating questions.');
      },
    });
  }

  // ✅ Start webcam and wait till ready
  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;

      // Wait for camera readiness
      video.onloadedmetadata = () => video.play();
      video.onplaying = () => {
        console.log('✅ Video feed ready, starting frame streaming...');
        setTimeout(() => this.startFrameStreaming(), 1200);
        this.startAutoListening();
      };
      console.log('🎥 Camera started');
    } catch (err) {
      console.error('Camera error:', err);
      alert('Please allow camera & microphone access.');
    }
  }

  // ✅ Start streaming frames to backend every second
  startFrameStreaming() {
    if (!this.videoElement?.nativeElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 320;
    canvas.height = 240;

    let frameCount = 0;

    this.frameInterval = setInterval(async () => {
      try {
        frameCount++;
        if (frameCount < 5) return; // ignore first few blank frames

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
        const formData = new FormData();
        formData.append('candidate_id', String(this.candidateId));
        formData.append('frame', blob);

        this.svc.dataFrameSet(formData).subscribe({
          next: (result: any) => {
            if (!result) return;

            if (result.message === 'No face detected') {
              console.log('⚠️ Waiting for face...');
              return;
            }

            if (result.alert && result.message === 'Proxy detected') {
              console.warn('🚨 Proxy Detected:', result.message);
              this.stopCamera();
              alert('Proxy Detected! Please ensure only the registered candidate is visible.');
            } else {
              console.log(`🧠 Expression: ${result.expression} | Lip Sync: ${result.lip_sync}`);
            }
          },
          error: (err) => console.error('Frame analysis API error:', err),
        });
      } catch (err) {
        console.error('Frame capture error:', err);
      }
    }, 1000);
  }

  stopFrameStreaming() {
    if (this.frameInterval) clearInterval(this.frameInterval);
  }

  // ✅ Voice listening logic
  startAutoListening() {
    const Speech = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Speech) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    this.recognition = new Speech();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = false;

    this.finalTranscript = '';
    this.interimTranscript = '';
    this.recording = true;

    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        this.interimTranscript = interim;
        if (final) this.finalTranscript += (this.finalTranscript ? ' ' : '') + final;
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.recording = false;
        if (this.finalTranscript.trim().length > 3) {
          this.submitAnswer(this.finalTranscript);
        } else {
          console.log('🕓 No voice input — restarting...');
          setTimeout(() => this.startAutoListening(), 2000);
        }
      });
    };

    this.recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      this.recording = false;
    };

    this.recognition.start();
    console.log('🎤 Listening started');
  }

  submitAnswer(answerText: string) {
    if (!this.questions.length) return;
    const q = this.questions[this.currentIndex];
    if (!answerText.trim()) return;

    const formData = new FormData();
    formData.append('candidate_id', String(this.candidateId));
    formData.append('question_id', String(q.id));
    formData.append('answer_text', answerText);
    formData.append('candidate_skills', this.setupForm.value.candidate_skills);
    formData.append('experience', String(this.setupForm.value.experience));
    formData.append('job_description', this.setupForm.value.job_description);
    formData.append('required_skills', this.setupForm.value.required_skills);

    this.loadingSubmit = true;
    this.svc.submitAnswer(formData).subscribe({
      next: (res: any) => {
        this.loadingSubmit = false;
        console.log(`✅ Answer submitted. Score: ${res?.accuracy_score ?? res?.accuracy}`);

        this.finalTranscript = '';
        this.interimTranscript = '';

        if (this.currentIndex < this.questions.length - 1) {
          this.currentIndex++;
          setTimeout(() => this.startAutoListening(), 1500);
        } else {
          this.stopCamera();
          alert('🎉 Interview completed successfully!');
        }
      },
      error: (err) => {
        console.error(err);
        this.loadingSubmit = false;
        alert('Error submitting answer.');
      },
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      console.log('🎥 Camera stopped');
    }
    this.stopFrameStreaming();
  }

  logout() {
    this._token.logout();
  }
}
