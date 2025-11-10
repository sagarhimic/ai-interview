import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Interviews } from '../core/_services/Interviews';
import { Token } from '../core/_services/token';
import { HttpClient } from '@angular/common/http';

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
  //timeLeft = 20;
  timerInterval: any;
  recognition: any;       // speech recognition instance
  isListening = false;
  speechTimer: any;
  summary: any = [];

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

 /** 🎥 Start camera & interview */
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.video.nativeElement.srcObject = stream;
      this.startFrameAnalysis(); // begin sending frames
    } catch (err) {
      console.error('Camera error:', err);
    }
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

  /** ⏱️ Start 20-second timer per question */
  // startQuestionTimer() {
  //   clearInterval(this.timerInterval);
  //   this.timeLeft = 20;
  //   this.timerInterval = setInterval(() => {
  //     this.timeLeft--;
  //     if (this.timeLeft <= 0) {
  //       clearInterval(this.timerInterval);
  //       this.autoSubmitAnswer();
  //     }
  //   }, 1000);
  // }

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
  utterance.pitch = 1;      // Adjust 0–2 (1 = normal)
  utterance.rate = 1;       // Adjust speed (0.8–1.2 sounds more natural)
  utterance.volume = 1;     // 0–1

  // Optional: choose a specific voice (e.g., female interviewer)
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.name.includes('Google US English Female') ||
    v.name.includes('Samantha') ||
    v.name.includes('Zira')
  );
  if (preferredVoice) utterance.voice = preferredVoice;

  utterance.onstart = () => this.stopListening(); // pause listening during interviewer voice
  utterance.onend = () => this.startListening();  // resume listening after
  window.speechSynthesis.speak(utterance);
}

  /** 🎤 Start AI Interview (after “Start Interview” button) */
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

/** 🎤 Initialize Web Speech Recognition */
initSpeechRecognition() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error('Speech Recognition not supported in this browser.');
    return;
  }

  this.recognition = new SpeechRecognition();
  this.recognition.continuous = true;
  this.recognition.interimResults = true;
  this.recognition.lang = 'en-US';

  this.recognition.onstart = () => {
    console.log('🎙️ Listening...');
    this.isListening = true;
    this.recording = true;
    this.interimTranscript = '';
    this.finalTranscript = '';
  };

  this.recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        this.finalTranscript += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    this.interimTranscript = interim.trim();
  };

  this.recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    this.isListening = false;
    this.recording = false;
  };

  this.recognition.onend = () => {
    console.log('🛑 Speech recognition stopped.');
    this.isListening = false;
    this.recording = false;

    // Auto-submit after user stops speaking for a few seconds
    if (this.finalTranscript.trim().length > 0) {
      //console.log('Auto submitting answer:', this.finalTranscript);
      this.autoSubmitAnswer();
    }
  };
}

/** 🧠 Start listening */
startListening() {
  if (this.recognition && !this.isListening) {
    this.recognition.start();
  }
}

/** 🧠 Stop listening */
stopListening() {
  if (this.recognition && this.isListening) {
    this.recognition.stop();
  }
}

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
