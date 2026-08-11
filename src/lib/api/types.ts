export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export type TopicCategory =
  | "GRAMMAR_TOPIC"
  | "GRAMMAR_LEVEL"
  | "GRAMMAR_MOCK_TEST"
  | "BILINGUAL_LEVEL"
  | "WRITING_PART1"
  | "WRITING_PART2";

/** Chỉ dùng TOEIC + GENERAL (+ các loại luyện tập) trên UI — không IELTS. */
export type QuizType =
  | "TOEIC"
  | "GENERAL"
  | "LISTENING_PRACTICE"
  | "BILINGUAL_READING"
  | "WRITING_PICTURE"
  | "WRITING_EMAIL"
  | "IELTS" // legacy API — không hiển thị trên UI
  | "VSTEP";

export type SpeakingCategory = "TOEIC" | "GENERAL";

export type UserProfile = {
  id: number;
  email: string;
  role: Role;
  totalBanhRan?: number;
  streakCount?: number;
  profile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type VocabTopic = {
  id: number;
  title?: string;
  name?: string;
  description?: string | null;
  categoryName?: string;
  totalWords?: number;
  learnedCount?: number;
  needReviewCount?: number;
  isPro?: boolean;
  imageUrl?: string | null;
  wordCount?: number;
  [key: string]: unknown;
};

export type VocabTopicsResponse = {
  categories?: { name: string; count: number; topics: VocabTopic[] }[];
  topics?: VocabTopic[];
};

export type VocabWord = {
  id: number;
  word: string;
  meaning?: string;
  pos?: string | null;
  phonetic?: string | null;
  ipaUs?: string | null;
  ipaUk?: string | null;
  example?: string | null;
  exampleEn?: string | null;
  exampleVi?: string | null;
  audioUrl?: string | null;
  audioUs?: string | null;
  audioUk?: string | null;
  imageUrl?: string | null;
  isStarred?: boolean;
  isMastered?: boolean;
  [key: string]: unknown;
};

export type PracticeTopic = {
  id: number;
  title?: string;
  name?: string;
  vietnameseName?: string | null;
  description?: string | null;
  category?: TopicCategory;
  thumbnail?: string | null;
  quizzes?: QuizSummary[];
  progress?: unknown;
  [key: string]: unknown;
};

export type QuizSummary = {
  id: number;
  title: string;
  type?: QuizType;
  description?: string | null;
  timeLimit?: number | null;
  _count?: { questions?: number };
  [key: string]: unknown;
};

export type Question = {
  id: number;
  type: string;
  content: string | Record<string, unknown>;
  order?: number;
  part?: number | string;
  options?: string[] | { text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  [key: string]: unknown;
};

export type QuizDetail = QuizSummary & {
  questions?: Question[];
  theoryContent?: string | null;
};

export type SubmissionResultItem = {
  questionId: number;
  answer: string;
  isCorrect: boolean;
  score: number;
  [key: string]: unknown;
};

export type SubmitQuizResponse = {
  id: number;
  quizId: number;
  userId: number;
  score: number;
  aiFeedback?: string | null;
  results: SubmissionResultItem[];
  [key: string]: unknown;
};

export type QuizCategoryBreakdown = {
  category: string;
  correct: number;
  total: number;
  accuracyPercent: number;
};

export type QuizAnalytics = {
  submissionId: number;
  quizTitle: string;
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracyPercent: number;
  categoriesBreakdown: QuizCategoryBreakdown[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  [key: string]: unknown;
};

export type ToeicScoreConversion = {
  listening: { correct: number; total: number; score: number };
  reading: { correct: number; total: number; score: number };
  totalScore: number;
};

export type Course = {
  id: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  classes?: ClassSummary[];
  [key: string]: unknown;
};

export type ClassSummary = {
  id: number;
  name: string;
  meetingLink?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  teacher?: {
    id: number;
    email?: string;
    profile?: { fullName?: string | null } | null;
  } | null;
  lessons?: Lesson[];
  [key: string]: unknown;
};

export type Lesson = {
  id: number;
  title: string;
  order?: number;
  materials?: Material[];
  [key: string]: unknown;
};

export type Material = {
  id: number;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  [key: string]: unknown;
};

export type SpeakingExercise = {
  id: number;
  title: string;
  promptText?: string;
  targetText?: string;
  category?: string;
  difficulty?: string;
  referenceAudioUrl?: string | null;
  [key: string]: unknown;
};

export type SpeakingSubmission = {
  id: number;
  exerciseId?: number;
  audioUrl?: string | null;
  overallScore?: number | null;
  aiFeedback?: { feedback?: string; overallScore?: number; [key: string]: unknown } | null;
  submittedAt?: string;
  exercise?: { id?: number; title?: string } | null;
  [key: string]: unknown;
};

export type CommunitySubmission = {
  id: number;
  user?: string;
  score?: number;
  answer?: string;
  feedback?: unknown;
  submittedAt?: string;
  [key: string]: unknown;
};

export type LeaderboardEntry = {
  userId?: number;
  rank?: number;
  totalPoints?: number;
  totalBanhRan?: number;
  user?: {
    id: number;
    email?: string;
    profile?: { fullName?: string | null };
  };
  [key: string]: unknown;
};

export type Badge = {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  [key: string]: unknown;
};

export type UserBadge = {
  id?: number;
  badge?: Badge;
  badgeId?: number;
  [key: string]: unknown;
};

export type UploadResult = {
  url: string;
  key: string;
  contentType?: string;
};
