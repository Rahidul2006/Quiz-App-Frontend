export type EventStatus =
  | 'WAITING'
  | 'LIVE'
  | 'ENDED'
  | 'waiting'
  | 'live'
  | 'ended'
  | 'draft'
  | 'active'
  | 'paused';

export interface EventSettings {
  require_name?: boolean;
  allow_anonymous?: boolean;
  show_live_results?: boolean;
}

export interface EventItem {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  joinCode: string;
  join_code?: string;
  status: EventStatus;
  theme?: string;
  duration?: number; // In minutes, e.g. 30
  startedAt?: string | null;
  started_at?: string | null;
  endsAt?: string | null;
  ends_at?: string | null;
  stoppedAt?: string | null;
  stopped_at?: string | null;
  settings: EventSettings;
  activeActivityId?: string | null;
  active_activity_id?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  participant_count?: number;
  activity_count?: number;
}

export interface Participant {
  id: string;
  _id?: string;
  eventId?: string;
  event_id?: string;
  name: string;
  email?: string;
  sessionToken?: string;
  session_token?: string;
  joinedAt?: string;
  joined_at?: string;
}

export type ActivityType = 'poll' | 'word_cloud' | 'quiz';
export type ActivityStatus =
  | 'WAITING'
  | 'LIVE'
  | 'ENDED'
  | 'draft'
  | 'active'
  | 'ended'
  | 'waiting'
  | 'live';

export type PollType =
  | 'single'
  | 'multiple'
  | 'yes_no'
  | 'rating'
  | 'ranking'
  | 'open_text';

export interface ActivitySettings {
  poll_type?: PollType;
  allow_multiple?: boolean;
  max_choices?: number;
  show_live_results?: boolean;
  allow_user_options?: boolean;
  timer_seconds?: number;
  quiz_state?: 'answering' | 'revealed' | 'leaderboard';
}

export interface PollOption {
  id: string;
  _id?: string;
  text: string;
  order_index: number;
  votes?: number;
  percentage?: number;
}

export interface WordFrequency {
  text: string;
  value: number;
  original: string;
}

export interface QuizOption {
  id: string;
  _id?: string;
  option_text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  _id?: string;
  question_text: string;
  time_limit_sec: number;
  points: number;
  explanation?: string;
  order_index: number;
  options: QuizOption[];
}

export interface LeaderboardEntry {
  participant_id: string;
  participant_name: string;
  total_score: number;
  correct_answers: number;
  total_questions: number;
  total_time_ms: number;
  rank: number;
}

export interface Activity {
  id: string;
  _id?: string;
  eventId?: string;
  event_id?: string;
  type: ActivityType;
  title: string;
  status: ActivityStatus;
  duration?: number; // In seconds, e.g. 30
  startedAt?: string | null;
  started_at?: string | null;
  endsAt?: string | null;
  ends_at?: string | null;
  stoppedAt?: string | null;
  stopped_at?: string | null;
  orderIndex?: number;
  order_index?: number;
  settings: ActivitySettings;
  activeQuestionIndex?: number;
  active_question_index?: number;
  createdAt?: string;
  created_at?: string;
  options?: PollOption[];
  questions?: QuizQuestion[];
  total_responses?: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}
