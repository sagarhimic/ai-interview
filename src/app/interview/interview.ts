import { Component, ElementRef, NgZone, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Interviews } from '../core/_services/Interviews';
import { Token } from '../core/_services/token';
import { HttpClient } from '@angular/common/http';
import { AvatarViewer } from '../components/avatar-viewer/avatar-viewer';

interface Instruction {
  img: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, AvatarViewer],
  templateUrl: './interview.html',
  styleUrl: './interview.scss',
})
export class Interview implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) video!: ElementRef<HTMLVideoElement>;
  @ViewChild('typedAnswer', { static: false }) typedAnswer!: ElementRef<HTMLTextAreaElement>;

  setupForm!: FormGroup;
  questions: any[] = [];
  currentIndex = 0;
  finalTranscript: string = '';
  interimTranscript: string = '';
  recording: boolean = false;
  loadingGenerate = false;
  loadingSubmit = false;
  user_info: any = {};
  status: string = 'active';
  statusMessage: string = '';
  timerInterval: any;
  recognition: any;       // speech recognition instance
  isListening = false;
  speechTimer: any;
  summary: any = [];

  /** 🎥 Video recording state */
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingMime = 'video/webm';
  public recordingStarted = false;

  cameraAllowed = false;
  micAllowed = false;

  // recognition helpers
  private silenceTimer: any = null;
  private SILENCE_MS = 2500; // consider "end of speech" after 2.5s silence
  private lastFinalTranscript = ''; // to avoid duplicate auto-submits
  private isTTSPlaying = false; // flag so recognition doesn't treat TTS as speech
  private waitingToRestart = false; // avoid concurrent restarts

  instructions: Instruction[] = [
    {
      img: '/img/web-security.png',
      title: 'Navigating the Interview Platform:',
      text: `After clicking <span class="purple-text-color">"Get Started"</span>, do not use the back button, open a new tab/window, or view your browsing history. Doing so will automatically end your interview session.`
    },
    {
      img: '/img/web-camera.png',
      title: 'Camera Usage:',
      text: `Your camera must remain <span class="purple-text-color">on at all times</span> during the interview. If the camera is turned off or disabled, the interview will end immediately.`
    },
    {
      img: '/img/working-time.png',
      title: 'Timeliness:',
      text: `Complete the interview within the allotted time. When the scheduled time ends, the interview will automatically close.`
    },
    {
      img: '/img/wireless-connection.png',
      title: 'Internet Connectivity:',
      text: `Ensure you have a <span class="purple-text-color">stable and uninterrupted internet connection</span> to avoid disruptions.`
    },
    {
      img: '/img/maintenance.png',
      title: 'Technical Issues:',
      text: `If you face any technical difficulties, please contact us via email at <span class="purple-text-color">[mail id]</span>.`
    },
    {
      img: '/img/padlock.png',
      title: 'Re-Login Policy:',
      text: `Once you log out or exit the interview, <span class="purple-text-color">re-login is not permitted</span>.`
    },
    {
      img: '/img/video-camera.png',
      title: 'Recording Notice:',
      text: `The entire interview session will be <span class="purple-text-color">recorded for evaluation and review</span> purposes.`
    },
    {
      img: '/img/voice-message.png',
      title: 'Answer Capturing:',
      text: `All your responses will be <span class="purple-text-color">recorded and stored as transcripts</span> for review purposes.`
    }
  ];

  constructor(
    private fb: FormBuilder,
    private svc: Interviews,
    private ngZone: NgZone,
    private _token: Token,
    private http: HttpClient
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

  async startCamera() {
  try {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const videoEl = this.video.nativeElement;
    videoEl.srcObject = this.mediaStream;
    videoEl.muted = true; // ✅ Prevent echo from preview
    await videoEl.play();

    this.startRecording();
    this.startFrameAnalysis();
  } catch (err) {
    console.error('Camera error:', err);
    alert('Camera permission denied or unavailable.');
  }
}

  /** 🎥 Start recording automatically */
  startRecording() {
    if (!this.mediaStream) return;

    const supportedTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm'
    ];
    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        this.recordingMime = type;
        break;
      }
    }

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: this.recordingMime,
      videoBitsPerSecond: 2500000
    });

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.recordedChunks, { type: this.recordingMime });
      console.log('🎬 Recording complete, uploading...');
      await this.uploadFullVideo(blob);
    };

    this.mediaRecorder.onerror = (err) => console.error('Recorder error:', err);
    this.mediaRecorder.start(2000);
    this.recordingStarted = true;
    console.log('🎥 Interview recording started automatically');
  }

  /** 🛑 Stop recording when interview ends */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('🛑 Stopping video recording...');
      this.mediaRecorder.stop();
    }
  }

  /** ⬆️ Upload recorded video to backend */
uploadFullVideo(blob: Blob) {
  const candidate = this._token.getUserData();
  const candidateId = candidate?.data?.candidate_id || 'unknown';

  const formData = new FormData();
  formData.append('candidate_id', candidateId);
  formData.append('video_file', blob, `interview_${candidateId}_${Date.now()}.webm`);

  console.log('📤 Uploading full interview video...');

  this.svc.uploadFullVideo(formData).subscribe({
    next: (response: any) => {
      console.log('✅ Video uploaded successfully:', response);
      this.loadingSubmit = false;
    },
    error: (err) => {
      console.error('❌ Error uploading video:', err);
      this.loadingSubmit = false;
      alert('Video upload failed — please check your connection or retry.');
    },
    complete: () => {
      console.log('🎬 Video upload complete.');
    }
  });
}

/** 🎥 Continuously analyze frames & draw bounding boxes */
startFrameAnalysis() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const video = this.video.nativeElement;

  // Create overlay canvas (for green face rectangles)
  const overlayCanvas = document.createElement('canvas');
  const overlayCtx = overlayCanvas.getContext('2d')!;
  overlayCanvas.style.position = 'absolute';
  overlayCanvas.style.top = '0';
  overlayCanvas.style.left = '0';
  overlayCanvas.style.zIndex = '2';
  video.parentElement?.appendChild(overlayCanvas);

  setInterval(() => {
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const formData = new FormData();
      const candidateID = this._token.getUserData();
      formData.append('candidate_id', candidateID.data.candidate_id);
      formData.append('frame', blob, 'frame.jpg');

      this.svc.dataFrameSet(formData).subscribe({
        next: (response: any) => {
          this.status = response.status || 'active';
          this.statusMessage = response.reason || '';

          /** 🟩 Draw face boxes if available */
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          if (response.face_boxes && response.face_boxes.length) {
            overlayCtx.lineWidth = 2;
            overlayCtx.strokeStyle = 'lime';
            overlayCtx.font = '14px Arial';
            overlayCtx.fillStyle = 'lime';

            response.face_boxes.forEach((box: any) => {
              overlayCtx.strokeRect(box.x, box.y, box.w, box.h);
              overlayCtx.fillText('Face', box.x, box.y - 5);
            });
          }

          /** 🔁 Handle statuses */
          if (this.status === 'paused') {
            this.stopCamera();
            alert('Interview paused: ' + (response.reason || 'Multiple faces detected.'));
          } else if (this.status === 'idle') {
            this.playTTS('Are you still there? Please continue speaking.');
          } else if (this.status === 'idle_for_submission') {
            this.playTTS('You seem idle. Moving to the next question.');
            this.autoSubmitAnswer();
          }
        },
        error: (err) => {
          console.error('Frame analysis failed', err);
        }
      });
    }, 'image/jpeg');
  }, 2000);
}

  stopCamera() {
  const videoElement = this.video.nativeElement;
  const mediaStream = videoElement.srcObject as MediaStream | null;

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null; // clear camera stream
    console.log('📷 Camera stopped successfully.');
  } else {
    console.warn('No active camera stream found.');
  }
}

/** ✅ Cleanup when component unloads */
  ngOnDestroy() {
    console.log('🧹 Cleaning up resources...');
    this.stopRecording();
    this.stopCamera();
  }

  /** 🤖 Auto-submit when time expires or user stops speaking */
  autoSubmitAnswer() {
    if (this.finalTranscript?.trim()) {
      this.submitAnswer(this.finalTranscript);
    } else {
      this.submitAnswer('No response detected');
    }
  }

  /** ✍️ Manual or auto submission using Interviews service */
submitAnswer(answer: string) {
  this.loadingSubmit = true;
  const currentQ = this.questions[this.currentIndex];

  const formData = new FormData();
  const candidateID = this._token.getUserData();

  formData.append('candidate_id', candidateID.data.candidate_id);
  formData.append('question_id', currentQ.id);
  formData.append('answer_text', answer);
  formData.append('candidate_skills', candidateID.data.candidate_skills);
  formData.append('experience', candidateID.data.experience);
  formData.append('job_description', candidateID.data.job_description || '');
  formData.append('required_skills', candidateID.data.required_skills || '');

  this.svc.submitAnswer(formData).subscribe({
    next: (response: any) => {
      //console.log('✅ Answer submitted successfully:', response);
      this.loadingSubmit = false;
      this.getCandidateSummary();
      this.nextQuestion();
    },
    error: (err) => {
      console.error('❌ Error submitting answer:', err);
      this.loadingSubmit = false;
    }
  });
}

  /** 🎯 Move to next question */
  nextQuestion() {
  if (this.currentIndex + 1 < this.questions.length) {
    this.currentIndex++;
    this.finalTranscript = '';
    this.interimTranscript = '';
    //this.startQuestionTimer();
    this.playTTS(this.questions[this.currentIndex].question);

    // restart listening
    this.stopListening();
    setTimeout(() => this.startListening(), 1000); // small delay after question TTS
  } else {
    this.stopListening();
    this.stopCamera();
    this.playTTS('Thank you! The interview is now complete.');
    alert('Interview finished');
  }
}

  /** 🔊 Play interviewer voice using Web Speech API (no backend) */
playTTS(text: string) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google US English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Zira')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      // Pause recognition when TTS speaks
      this.isTTSPlaying = true;
      this.stopListening();
    };
    utterance.onend = () => {
      // resume recognition after a short delay to avoid picking up TTS tail
      setTimeout(() => { this.isTTSPlaying = false; this.startListening(); }, 250);
    };

    window.speechSynthesis.speak(utterance);
  }

  /** 🎤 Start AI Interview (after “Start Interview” button) */
generateQuestions() {
  this.loadingGenerate = true;

  const formData = new FormData();
  Object.keys(this.setupForm.controls).forEach(key => {
    formData.append(key, this.setupForm.value[key]);
  });

  this.svc.generateQuestions(formData).subscribe({
    next: async (response: any) => {
      this.questions = response.questions;
      this.loadingGenerate = false;

      // ✅ Start interview session
      await this.startCamera();
      this.initSpeechRecognition();
      this.startListening(); // Start capturing candidate's speech
      this.playTTS(this.questions[0].question);
      //this.startQuestionTimer();
      this.getCandidateSummary();
    },
    error: (err) => {
      console.error('Error generating questions', err);
      this.loadingGenerate = false;
    }
  });
}

/* ---------- Improved Speech Recognition ---------- */

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser.');
      return;
    }

    // Create recognition instance
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;       // keep receiving results
    this.recognition.interimResults = true;   // we want interim for live transcript
    this.recognition.lang = 'en-US';          // set as appropriate
    this.recognition.maxAlternatives = 3;     // helpful for accuracy checks

    // onstart
    this.recognition.onstart = () => {
      console.log('🎙️ Recognition started');
      this.isListening = true;
      this.recording = true;
      // clear any old transcripts only when a new question starts externally
      // (we already clear finalTranscript when moving to next question)
    };

    // onresult
    this.recognition.onresult = (event: any) => {
      // Build interim + final transcripts
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t = res[0].transcript;
        if (res.isFinal) {
          // append final
          this.finalTranscript = (this.finalTranscript ? this.finalTranscript + ' ' : '') + t.trim();
        } else {
          interim += t;
        }
      }

      this.interimTranscript = interim.trim();

      // Reset silence timer every time we receive speech (interim or final)
      this.resetSilenceTimer();

      // Optionally: display best alternative if you want
      // const best = event.results[event.results.length-1][0].transcript;

      // If final transcript updated, optionally auto-submit after silence (handled by silence timer)
    };

    // onerror
    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      this.recording = false;
      // Attempt to recover on transient errors
      if (event.error === 'no-speech' || event.error === 'network') {
        // restart after short delay
        setTimeout(() => this.safeRestartRecognition(), 500);
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // permission denied or blocked — inform user
        alert('Microphone permission is blocked. Please enable microphone access.');
      } else {
        // generic recover
        setTimeout(() => this.safeRestartRecognition(), 800);
      }
    };

    // onend — called when recognition stops (Chrome sometimes ends automatically)
    this.recognition.onend = () => {
      console.log('🎙️ Recognition ended');
      this.isListening = false;
      this.recording = false;
      // If we ended because of TTS, do not auto-restart until TTS finished
      if (!this.isTTSPlaying) {
        // Try to restart automatically (some browsers end after ~60s)
        this.safeRestartRecognition();
      }
    };
  }

  /** start listening safely */
  startListening() {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) return;
    try {
      if (!this.isListening && !this.isTTSPlaying) {
        this.recognition.start();
      }
    } catch (e) {
      // .start() can throw if called too quickly; try a safe restart
      console.warn('startListening error:', e);
      setTimeout(() => { try { this.recognition.start(); } catch(e){ /* ignore */ } }, 300);
    }
  }

  /** stop listening safely */
  stopListening() {
    // Clear silence timer
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch(e){ console.warn('stopListening catch', e); }
      this.isListening = false;
      this.recording = false;
    }
  }

  /** Reset silence timer — called whenever we receive speech */
  resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      // silence detected — treat as end of answer
      console.log(`⏱️ ${this.SILENCE_MS}ms silence detected — finalizing answer`);
      // Only submit if there's a non-empty final transcript and it's different than last submitted
      const trimmed = (this.finalTranscript || '').trim();
      if (trimmed && trimmed !== this.lastFinalTranscript) {
        this.lastFinalTranscript = trimmed;
        // auto submit (use ngZone to ensure Angular change detection if called from event)
        this.ngZone.run(() => {
          this.autoSubmitAnswer();
        });
      } else {
        // no speech captured — optional handling (submit empty or ignore)
        console.log('No new speech to submit after silence.');
      }
      // keep recognition running continuously (do not stop) — optionally restart to avoid onend
      // We'll restart if necessary in safeRestartRecognition
    }, this.SILENCE_MS);
  }

  /** Try to restart recognition if it has ended — ensure only one restart at a time */
  private safeRestartRecognition() {
    if (this.waitingToRestart) return;
    this.waitingToRestart = true;
    setTimeout(() => {
      try {
        if (!this.isTTSPlaying && this.recognition && !this.isListening) {
          this.recognition.start();
        }
      } catch (e) {
        console.warn('safeRestartRecognition failed', e);
      } finally {
        this.waitingToRestart = false;
      }
    }, 500);
  }

  /* ---------- TTS integration: pause recognition during TTS ---------- */

getCandidateSummary() {
  
  this.loadingSubmit = true;
  const formData = new FormData();
  const candidateID = this._token.getUserData();

  console.log(candidateID);

  formData.append('candidate_id', candidateID.data.candidate_id);

  this.svc.getSummary(formData).subscribe({
    next: (response: any) => {
      this.summary = response.answers;
      //console.log(this.summary);
    },
    error: (err) => {
      console.error('❌ Error submitting answer:', err);
      this.loadingSubmit = false;
    }
  });
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
