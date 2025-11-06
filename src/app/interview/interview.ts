import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Interviews } from '../core/_services/Interviews';
import { Token } from '../core/_services/token';

interface Instruction {
  img: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './interview.html',
  styleUrl: './interview.scss',
})
export class Interview implements OnInit {
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
  readonly maxSilenceDuration = 30000; // 40 sec inactivity

  // Flags updated from backend
  lastFaceDetected = true;
  lastLipMoving = false;
  proxyDetected = false;

  // Recording related fields
  private videoStream: MediaStream | null = null;   // video only (preview)
  private micStream: MediaStream | null = null;     // mic audio only
  private fullRecorder: MediaRecorder | null = null; // records combined video+audio
  private fullChunks: BlobPart[] = [];
  private questionAudioRecorder: MediaRecorder | null = null;
  private questionAudioChunks: BlobPart[] = [];
  private interviewRecordingStarted = false;




  instructions: Instruction[] = [
    {
      img: '/img/web-security.png',
      title: 'Navigating the Interview Platform:',
      text: `After clicking <span class="purple-text-color">"GET STARTED"</span>, avoid using the back button, viewing your browsing history, or opening a new window. Doing so will immediately end your interview session.`
    },
    {
      img: '/img/web-security.png',
      title: 'Camera Usage:',
      text: `Ensure your camera remains on throughout the interview. Turning it off at any point will result in the interview ending automatically.`
    },

    {
      img: '/img/web-security.png',
      title: 'Timeliness:',
      text: `Complete the interview within your scheduled time. If the allotted time expires, the interview will automatically conclude.`
    }
  ];



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
  // small delay for audio routing stabilization
  setTimeout(() => {
    // start per-question audio
    const qid = this.questions[this.currentIndex]?.id;
    this.startQuestionAudioRecording(qid);
    this.startAutoListening();
  }, 900);
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
    // 1) video-only stream for preview (no mic -> avoids preview echo)
    this.videoStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false
    });

    // 2) mic-only stream (always requested so we can record audio)
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    // attach preview
    const video = this.videoElement.nativeElement as HTMLVideoElement;
    video.srcObject = this.videoStream;
    await video.play();

    // Start streaming frames (your existing startFrameStreaming)
    setTimeout(() => this.startFrameStreaming(), 1200);

    // Start full interview recorder (combined video + mic)
    this.startFullInterviewRecording();

    console.log('🎥 Camera + mic ready');
  } catch (err) {
    console.error('Camera/mic error:', err);
    alert('Please allow camera & microphone access.');
  }
}

startFullInterviewRecording() {
  if (!this.videoElement || !this.micStream) return;

  // Capture video frames from the playing video element
  const videoEl = this.videoElement.nativeElement as HTMLVideoElement;
  const videoCaptureStream: MediaStream = (videoEl as any).captureStream
    ? (videoEl as any).captureStream()
    : this.videoStream!; // fallback

  // Compose combined stream: video frames + mic audio track
  const combined = new MediaStream();
  // add video tracks
  videoCaptureStream.getVideoTracks().forEach(t => combined.addTrack(t));
  // add mic audio track
  const micTrack = this.micStream!.getAudioTracks()[0];
  if (micTrack) combined.addTrack(micTrack);

  // create MediaRecorder for full interview
  try {
    this.fullChunks = [];
    this.fullRecorder = new MediaRecorder(combined, { mimeType: 'video/webm; codecs=vp9,opus' });
  } catch (e) {
    // fallback mimeType
    this.fullRecorder = new MediaRecorder(combined);
  }

  this.fullRecorder.ondataavailable = (ev: any) => {
    if (ev.data && ev.data.size) this.fullChunks.push(ev.data);
  };

  this.fullRecorder.onstop = async () => {
    const blob = new Blob(this.fullChunks, { type: 'video/webm' });
    // upload full video
    await this.uploadFullVideo(blob);
    console.log('Full interview uploaded');
  };

  this.fullRecorder.start(); // continuous recording
  this.interviewRecordingStarted = true;
  console.log('🔴 Full interview recording started');
}

startQuestionAudioRecording(questionId?: number) {
  if (!this.micStream) return;
  // reset chunks
  this.questionAudioChunks = [];
  try {
    this.questionAudioRecorder = new MediaRecorder(this.micStream, { mimeType: 'audio/webm;codecs=opus' });
  } catch (e) {
    this.questionAudioRecorder = new MediaRecorder(this.micStream);
  }

  this.questionAudioRecorder.ondataavailable = (ev: any) => {
    if (ev.data && ev.data.size) this.questionAudioChunks.push(ev.data);
  };

  this.questionAudioRecorder.onstop = async () => {
    const blob = new Blob(this.questionAudioChunks, { type: 'audio/webm' });
    // Upload to backend along with question id
    await this.uploadQuestionAudio(blob, questionId);
  };

  this.questionAudioRecorder.start();
  console.log('🔴 Question audio recording started');
}

stopQuestionAudioRecording() {
  try {
    if (this.questionAudioRecorder && this.questionAudioRecorder.state !== 'inactive') {
      this.questionAudioRecorder.stop();
      console.log('⏹ Question audio stopped');
    }
  } catch (e) { console.warn(e); }
}

// call svc.uploadQuestionAudio(formData) and svc.uploadFullVideo(formData)
async uploadQuestionAudio(blob: Blob, questionId?: number) {
  try {
    const fd = new FormData();
    fd.append('candidate_id', String(this.candidateId));
    if (questionId) fd.append('question_id', String(questionId));
    fd.append('audio_file', blob, `answer_q${questionId || 'unknown'}.webm`);
    await this.svc.uploadQuestionAudio(fd).toPromise();
    console.log('Uploaded question audio');
  } catch (e) { console.error('uploadQuestionAudio failed', e); }
}

async uploadFullVideo(blob: Blob) {
  try {
    const fd = new FormData();
    fd.append('candidate_id', String(this.candidateId));
    fd.append('video_file', blob, `interview_${Date.now()}.webm`);
    await this.svc.uploadFullVideo(fd).toPromise();
    console.log('Uploaded full video');
  } catch (e) { console.error('uploadFullVideo failed', e); }
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

    // 👀 Check visual cues before proceeding
      if (this.lastLipMoving || this.lastFaceDetected) {
        console.log('👄 Candidate still active, extending listening...');
        setTimeout(() => this.startAutoListening(), 1000);
        return;
      }

      if (this.finalTranscript.trim().length > 2) {
        this.submitAnswer(this.finalTranscript);
      } else {
        console.log('No clear answer — waiting briefly before retry');
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
  console.warn('⏰ Checking silence timeout...');

  // If candidate still visible or lips moving, extend timer slightly
  if (this.lastFaceDetected || this.lastLipMoving) {
    console.log('👀 Candidate active — extending timeout by 10s');
    clearTimeout(this.silenceTimeout);
    this.silenceTimeout = setTimeout(() => this.handleSilenceTimeout(), 10000);
    return;
  }

  // If not speaking and no movement for 30s
  console.log('😶 No response — stopping recognition and moving to next question');
  try {
    if (this.recognition) this.recognition.stop();
  } catch (e) {
    console.warn('Error stopping recognition:', e);
  }

  // Submit whatever we captured so far
  this.submitAnswer(this.finalTranscript || 'No verbal response detected');
}
  // -----------------------
  // Submit Answer
  // -----------------------
  submitAnswer(answerText: string) {
  if (!this.questions.length) return;
  const q = this.questions[this.currentIndex];
  if (!answerText.trim()) return;

  // Prevent duplicate submission
  if (this.loadingSubmit) return;

  const formData = new FormData();
  formData.append('candidate_id', String(this.candidateId));
  formData.append('question_id', String(q.id));
  formData.append('answer_text', answerText.trim());
  formData.append('candidate_skills', this.setupForm.value.candidate_skills);
  formData.append('experience', String(this.setupForm.value.experience));
  formData.append('job_description', this.setupForm.value.job_description);
  formData.append('required_skills', this.setupForm.value.required_skills);

  this.loadingSubmit = true;
  console.log(`📤 Submitting answer for question ${this.currentIndex + 1}...`);

  this.svc.submitAnswer(formData).subscribe({
    next: (res: any) => {
      this.loadingSubmit = false;
      console.log(`✅ Answer submitted. Score: ${res?.accuracy_score ?? res?.accuracy}`);
      this.finalTranscript = '';
      this.interimTranscript = '';

      if (this.currentIndex < this.questions.length - 1) {
        // 🎤 Speak interviewer transition line first
        this.speakText("Okay, let's move on to the next question.", () => {
          const delay = 10000 + Math.random() * 2000; // 10–12 seconds delay
          console.log(`⏱️ Waiting ${Math.round(delay / 1000)} seconds before next question...`);

          setTimeout(() => {
            this.currentIndex++;
            const nextQuestion = this.questions[this.currentIndex].question;

            // 🎙️ Speak next question completely before listening
            this.speakText(nextQuestion, () => {
              setTimeout(() => this.askAndListen(nextQuestion), 1000);
            });
          }, delay);
        });
      } else {
        this.stopCamera();
        this.speakText("That was the last question. Thank you for your time!", () => {
          alert('🎉 Interview completed successfully!');
        });
      }
    },
    error: (err) => {
      console.error('❌ Error submitting answer:', err);
      this.loadingSubmit = false;
      alert('Error submitting answer.');
    },
  });
}

  speakText(text: string, onComplete?: () => void) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      console.log('🗣️ Finished speaking:', text);
      if (onComplete) onComplete();
    };

    speechSynthesis.speak(utterance);
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
