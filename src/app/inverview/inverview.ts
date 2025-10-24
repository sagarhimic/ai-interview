import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Interviews } from '../core/_services/Interviews';
import { CommonModule } from '@angular/common';
import { Token } from '../core/_services/token';

@Component({
  selector: 'app-inverview',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './inverview.html',
  styleUrl: './inverview.scss',
})
export class Inverview implements OnInit {

  setupForm!: FormGroup;
  questions: { id: number, question: string }[] = [];
  currentIndex = 0;
 
  // speech recognition
  recognition: any = null;
  recording = false;
  interimTranscript = '';
  finalTranscript = '';
 
  // candidate placeholder
  // candidateId = Math.floor(Math.random() * 100000) + 1;
  candidateId = 5;
 
  loadingGenerate = false;
  loadingSubmit = false;
 
  constructor(
    private fb: FormBuilder,
    private svc: Interviews,
    private ngZone: NgZone,
    private auth: Token
  ) {}
 
  ngOnInit(): void {
    this.setupForm = this.fb.group({
      job_title: ['Python Developer/JPMC Tampa FL'],
      job_description: ['Python Developer/JPMC Tampa FL — backend role'],
      duration: [5, [Validators.required]],
      experience: [5, [Validators.required]],
      required_skills: ['Python, Flask, FastAPI, SQL, PyTest', [Validators.required]],
      candidate_skills: ['Python, HTML, CSS, PHP, MySQL', [Validators.required]]
    });
 
    const Speech = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (Speech) {
      this.recognition = new Speech();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.onresult = (event: any) => {
        this.ngZone.run(() => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) final += res[0].transcript;
            else interim += res[0].transcript;
          }
          this.interimTranscript = interim;
          if (final) {
            // append final into finalTranscript
            this.finalTranscript = (this.finalTranscript ? this.finalTranscript + ' ' : '') + final;
          }
        });
      };
      this.recognition.onend = () => {
        this.ngZone.run(() => this.recording = false);
      };
      this.recognition.onerror = (err: any) => {
        console.error('STT error', err);
        this.ngZone.run(() => this.recording = false);
      };
    }
  }
 
  generateQuestions() {
  if (this.setupForm.invalid) return;
  this.loadingGenerate = true;
  this.questions = [];

  const formData = new FormData();
  const payload = this.setupForm.value;
  formData.append('job_title', payload.job_title);
  formData.append('job_description', payload.job_description);
  formData.append('duration', String(payload.duration));
  formData.append('experience', String(payload.experience));
  formData.append('required_skills', payload.required_skills);
  formData.append('candidate_skills', payload.candidate_skills);

  this.svc.generateQuestions(formData).subscribe({
    next: (res: any) => {
      this.loadingGenerate = false;
      this.questions = Array.isArray(res.questions) ? res.questions : [];
      this.currentIndex = 0;
    },
    error: (err) => {
      console.error(err);
      this.loadingGenerate = false;
      alert('Error generating questions. Check backend logs.');
    }
  });
}

 
  startRecording() {
    if (!this.recognition) {
      alert('SpeechRecognition not supported in this browser (use Chrome).');
      return;
    }
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.recording = true;
    this.recognition.start();
  }
 
  stopRecording() {
    if (!this.recognition) return;
    this.recognition.stop(); // onend will set recording false
  }
 
  submitAnswer(typedValue?: string) {
  if (this.questions.length === 0) return alert('No questions generated');

  const q = this.questions[this.currentIndex];
  const answerText =
    (typedValue && typedValue.trim()) ||
    this.finalTranscript ||
    this.interimTranscript ||
    '';

  if (!answerText) return alert('Answer is empty. Type or speak an answer.');

  // ✅ Convert payload to FormData
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
      const score = res?.accuracy_score ?? res?.accuracy ?? null;
      alert(`Score received: ${score}`);

      // clear transcripts and move to next question
      this.finalTranscript = '';
      this.interimTranscript = '';
      if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
    },
    error: (err) => {
      console.error(err);
      this.loadingSubmit = false;
      alert('Error submitting answer. Check backend logs.');
    }
  });
}

 
  next() {
    if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
  }
  prev() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  logout() {
    this.auth.logout();
  }

}
