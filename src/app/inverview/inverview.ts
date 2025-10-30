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

  // Camera + voice
  stream: MediaStream | null = null;
  frameInterval: any = null;
  recognition: any = null;
  recording = false;
  interimTranscript = '';
  finalTranscript = '';
  silenceTimeout: any = null;
  readonly maxSilenceDuration = 40000; // 40 sec inactivity

  // Flags updated from backend
  lastFaceDetected = true;
  lastLipMoving = false;
  proxyDetected = false;

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
      experience: [
        this.extractNumericValue(this.user_info?.data?.experience),
        [Validators.required],
      ],
      required_skills: [this.user_info?.data?.required_skills, [Validators.required]],
      candidate_skills: [this.user_info?.data?.candidate_skills, [Validators.required]],
    });
  }

  // -----------------------
  // Start Interview
  // -----------------------
  generateQuestions() {
     console.log('🚀 generateQuestions called');
      if (this.setupForm.invalid) return;
       this.loadingGenerate = true;
        const formData = new FormData();
         const payload = this.setupForm.value;
          Object.keys(payload).forEach((k) => formData.append(k, payload[k]));
           this.svc.generateQuestions(formData).subscribe({
             next: async (res: any) => { 
              this.loadingGenerate = false;
              this.questions = Array.isArray(res.questions) ? res.questions : []; this.currentIndex = 0;
               // Start camera and then ask first question 
               await this.startCamera();
               if (this.questions.length > 0) {
                 this.askAndListen(this.questions[this.currentIndex].question);
                 } 
                }, error: (err) => {
                   console.error(err);
                   this.loadingGenerate = false; 
                   alert('Error generating questions.'); 
                  }, 
                }); 
              }
  // -----------------------
  // Speak → Listen
  // -----------------------
  async askAndListen(questionText: string) {
  await this.speakQuestion(questionText);
  setTimeout(() => this.startAutoListening(), 1500);
}


  // Speak Question TTS
  async speakQuestion(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();

  // 🔇 Stop mic recognition before speaking (to prevent echo)
  if (this.recognition && this.recording) {
    try {
      this.recognition.abort();
    } catch (e) {}
    this.recording = false;
  }

  // 🔇 Mute mic input (browser level)
  if (this.stream) {
    this.stream.getAudioTracks().forEach((track) => (track.enabled = false));
  }

  window.speechSynthesis.cancel();

  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      console.log('🗣 Speaking question...');
    };

    utterance.onend = () => {
      console.log('✅ Finished speaking question');
      // 🎙 Re-enable mic after system voice ends
      if (this.stream) {
        this.stream.getAudioTracks().forEach((track) => (track.enabled = true));
      }
      resolve();
    };

    setTimeout(() => window.speechSynthesis.speak(utterance), 200);
  });
}

  // -----------------------
  // Camera & Frame Streaming
  // -----------------------
  async startCamera() {
  try {
    // Enable audio with echo/noise cancellation
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    });

    const video = this.videoElement.nativeElement;
    video.srcObject = this.stream;
    await video.play();

    console.log('🎥 Camera started with echo suppression');
    setTimeout(() => this.startFrameStreaming(), 1200);
  } catch (err) {
    console.error('Camera error:', err);
    alert('Please allow camera & microphone access.');
  }
}


  startFrameStreaming() {
    if (!this.videoElement?.nativeElement) return;
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 320;
    canvas.height = 240;

    this.frameInterval = setInterval(async () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.7));

        const formData = new FormData();
        formData.append('candidate_id', String(this.candidateId));
        formData.append('frame', blob);

        this.svc.dataFrameSet(formData).subscribe({
          next: (result: any) => {
            if (!result) return;

            this.lastFaceDetected = result.message !== 'No face detected';
            this.lastLipMoving = !!result.lip_sync;
            this.proxyDetected = !!result.alert;

            console.log(
              `🧠 Face: ${this.lastFaceDetected} | Lip: ${this.lastLipMoving} | Expr: ${result.expression || 'N/A'}`
            );

            if (this.proxyDetected) {
              this.stopCamera();
              alert('🚨 Proxy Detected! Interview paused.');
            }
          },
          error: (err) => console.error('Frame analysis error:', err),
        });
      } catch (err) {
        console.error('Frame capture error:', err);
      }
    }, 1000);
  }

  // -----------------------
  // Voice Recognition + Inactivity Check
  // -----------------------
  startAutoListening() {
    const Speech = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Speech) return alert('Speech recognition not supported.');

    if (this.recording) return;

    this.recognition = new Speech();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.finalTranscript = '';
    this.interimTranscript = '';
    this.recording = true;

    const resetSilenceTimer = () => {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = setTimeout(() => this.handleSilenceTimeout(), this.maxSilenceDuration);
    };

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
        resetSilenceTimer();
      });
    };

    this.recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      this.recording = false;
      setTimeout(() => this.startAutoListening(), 1000);
    };

    this.recognition.onend = () => {
      this.recording = false;
      if (this.finalTranscript.trim().length > 2) {
        this.submitAnswer(this.finalTranscript);
      } else {
        console.log('Restarting listening...');
        setTimeout(() => this.startAutoListening(), 1500);
      }
    };

    try {
      this.recognition.start();
      resetSilenceTimer();
      console.log('🎤 Listening with 40s timeout');
    } catch (e) {
      console.error('Recognition start error:', e);
    }
  }

  handleSilenceTimeout() {
    console.warn('⏰ Silence timeout — verifying activity...');
    if (this.lastFaceDetected || this.lastLipMoving) {
      console.log('👀 Candidate still active — extending timeout by 15s');
      this.silenceTimeout = setTimeout(() => this.handleSilenceTimeout(), 10000);
      return;
    }

    console.log('😶 No activity — auto submitting answer');
    this.recognition.stop();
    this.submitAnswer(this.finalTranscript || 'No response detected');
  }

  // -----------------------
  // Submit Answer
  // -----------------------
  submitAnswer(answerText: string) {
    if (!this.questions.length) return;
    const q = this.questions[this.currentIndex];
    if (!answerText.trim()) return;

    const formData = new FormData();
    formData.append('candidate_id', String(this.candidateId));
    formData.append('question_id', String(q.id));
    formData.append('answer_text', answerText.trim());
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
          setTimeout(() => this.askAndListen(this.questions[this.currentIndex].question), 900);
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
    }
    if (this.frameInterval) clearInterval(this.frameInterval);
  }

  logout() {
    this._token.logout();
  }

  extractNumericValue(value: any): number | null {
    if (!value) return null;
    const match = String(value).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }
}
