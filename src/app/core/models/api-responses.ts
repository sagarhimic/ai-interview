/**
 * API Response Interfaces
 * Define strong types for all backend API responses to replace 'any' types
 */

// ==================== RECRUITER AUTH ====================
export interface RecruiterAuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    employee_id: string;
  };
}

// ==================== MEETING AUTH ====================
export interface MeetingAuthResponse {
  access_token: string;
  token_type: string;
  candidate: {
    id: number;
    name: string;
    email: string;
    meeting_id: string;
  };
}

// ==================== SCHEDULE INTERVIEW ====================
export interface ScheduleInterviewResponse {
  success: boolean;
  message: string;
  interview_id: string;
  candidate_id: string;
  meeting_link?: string;
}

// ==================== INTERVIEW QUESTIONS ====================
export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  duration?: number; // in seconds
  audio_url?: string;
}

export interface GenerateQuestionsRequest {
  interview_id: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GenerateQuestionsResponse {
  questions: InterviewQuestion[];
  interview_id: string;
}

// ==================== INTERVIEW SUBMISSION ====================
export interface CandidateAnswerDetail {
  question_id: string;
  answer_text: string;
  answer_duration?: number;
  confidence?: number;
}

export interface SubmitAnswerRequest {
  interview_id: string;
  answer: CandidateAnswerDetail;
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  score?: number;
}

// ==================== FRAME ANALYSIS ====================
export interface AnalyzeFrameRequest {
  interview_id: string;
  frame_data: string; // base64 encoded image
}

export interface AnalyzeFrameResponse {
  face_detected: boolean;
  face_confidence: number;
  lip_movement_detected: boolean;
  emotions?: {
    happy: number;
    sad: number;
    neutral: number;
    angry: number;
  };
}

// ==================== VIDEO UPLOAD ====================
export interface UploadAudioRequest {
  interview_id: string;
  question_id: string;
  audio_data: Blob;
}

export interface UploadVideoRequest {
  interview_id: string;
  video_data: Blob;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file_url?: string;
}

// ==================== CANDIDATE SUMMARY ====================
export interface CandidateSummary {
  interview_id: string;
  candidate_name: string;
  total_score: number;
  answers: CandidateAnswerDetail[];
  submitted_at: string;
}

export interface GetSummaryResponse {
  summary: CandidateSummary;
}

// ==================== XRAY SEARCH ====================
export interface XraySearchRequest {
  role?: string;
  location?: string;
  skills?: string;
  company?: string;
  min_exp?: number;
  max_exp?: number;
  pages?: number;
  page?: number;
  limit?: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  company?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  profile_url?: string;
  platforms?: string[];
  summary?: string;
  match_score?: number;
}

export interface XraySearchResponse {
  profiles: CandidateProfile[];
  total_count: number;
  page: number;
  pages: number;
}

// ==================== ERROR RESPONSES ====================
export interface ApiErrorResponse {
  detail: string;
  error_code?: string;
  status_code?: number;
}
