import { apiFetch, apiJson } from "./client";
import type {
  Badge,
  Course,
  ClassSummary,
  LeaderboardEntry,
  PracticeTopic,
  QuizDetail,
  QuizSummary,
  SpeakingExercise,
  TopicCategory,
  UploadResult,
  UserBadge,
  UserProfile,
  VocabTopic,
  VocabTopicsResponse,
} from "./types";

export const authApi = {
  profile: () => apiFetch<UserProfile>("/auth/profile"),
};

export const userApi = {
  profile: () => apiFetch<UserProfile>("/users/profile"),
};

export const vocabApi = {
  topics: () =>
    apiFetch<VocabTopicsResponse | VocabTopic[]>("/vocab/topics", {
      auth: false,
    }),
  topic: (id: number) => apiFetch(`/vocab/topics/${id}`),
  star: (wordId: number) =>
    apiFetch(`/vocab/words/${wordId}/star`, { method: "POST" }),
  master: (wordId: number) =>
    apiFetch(`/vocab/words/${wordId}/master`, { method: "POST" }),
  review: (wordId: number, isCorrect: boolean) =>
    apiJson(`/vocab/words/${wordId}/review`, { isCorrect }),
};

export const readingApi = {
  topics: (category?: TopicCategory) =>
    apiFetch<PracticeTopic[]>(
      category
        ? `/reading/topics?category=${encodeURIComponent(category)}`
        : "/reading/topics",
    ),
  topic: (id: number) => apiFetch<PracticeTopic>(`/reading/topics/${id}`),
  theory: (quizId: number) =>
    apiFetch(`/reading/quizzes/${quizId}/theory`),
  bilingualProgress: () => apiFetch("/reading/bilingual-progress"),
};

export const writingApi = {
  topics: () => apiFetch("/writing/topics", { auth: false }),
  quiz: (id: number) => apiFetch(`/writing/quizzes/${id}`, { auth: false }),
  community: (id: number) =>
    apiFetch(`/writing/quizzes/${id}/community`, { auth: false }),
  submitPart1: (id: number, answer: string) =>
    apiJson(`/writing/quizzes/${id}/submit`, { answer }),
  submitPart2: (emailPrompt: string, userResponse: string) =>
    apiJson("/writing/part2/submit", { emailPrompt, userResponse }),
  submitPart3: (essayTopic: string, userEssay: string) =>
    apiJson("/writing/part3/submit", { essayTopic, userEssay }),
};

export const speakingApi = {
  list: (category?: string) =>
    apiFetch<SpeakingExercise[]>(
      category
        ? `/speaking/exercises?category=${encodeURIComponent(category)}`
        : "/speaking/exercises",
    ),
  get: (id: number) =>
    apiFetch<SpeakingExercise>(`/speaking/exercises/${id}`),
  create: (body: Record<string, unknown>) =>
    apiJson("/speaking/exercises", body),
  submitAudio: (id: number, audio: Blob, filename = "recording.webm") => {
    const form = new FormData();
    form.append("audio", audio, filename);
    return apiFetch(`/speaking/exercises/${id}/submit`, {
      method: "POST",
      body: form,
    });
  },
  submitPart35: (promptText: string, studentResponse: string) =>
    apiJson("/speaking/part3-5/submit", { promptText, studentResponse }),
  mySubmissions: () => apiFetch("/speaking/my-submissions"),
};

export const quizApi = {
  listeningPractice: () =>
    apiFetch<QuizSummary[]>("/quizzes/listening-practice"),
  get: (id: number) => apiFetch<QuizDetail>(`/quizzes/${id}`),
  create: (body: Record<string, unknown>) => apiJson("/quizzes", body),
  addQuestion: (id: number, body: Record<string, unknown>) =>
    apiJson(`/quizzes/${id}/questions`, body),
  submit: (
    id: number,
    answers: { questionId: number; answer: string }[],
  ) => apiJson(`/quizzes/${id}/submit`, { answers }),
  analytics: (submissionId: number) =>
    apiFetch(`/quizzes/submissions/${submissionId}/analytics`),
  scoreConversion: (listeningCorrect: number, readingCorrect: number) =>
    apiJson("/quizzes/score-conversion", {
      listeningCorrect,
      readingCorrect,
    }),
};

export const courseApi = {
  list: () => apiFetch<Course[]>("/courses"),
  get: (id: number) => apiFetch<Course>(`/courses/${id}`),
  create: (body: {
    title: string;
    description?: string;
    thumbnail?: string;
    price?: number;
  }) => apiJson("/courses", body),
  remove: (id: number) =>
    apiFetch(`/courses/${id}`, { method: "DELETE" }),
  createClass: (
    courseId: number,
    body: { name: string; description?: string },
  ) => apiJson(`/courses/${courseId}/classes`, body),
  getClass: (classId: number) =>
    apiFetch<ClassSummary>(`/courses/classes/${classId}`),
  createLesson: (
    classId: number,
    body: { title: string; order?: number },
  ) => apiJson(`/courses/classes/${classId}/lessons`, body),
  addMaterial: (
    lessonId: number,
    body: { title: string; fileUrl: string; fileType?: string },
  ) => apiJson(`/courses/lessons/${lessonId}/materials`, body),
};

export const aiApi = {
  chat: (prompt: string) => apiJson<{ reply: string }>("/ai/chat", { prompt }),
  generateDictation: (body?: { topic?: string; count?: number }) =>
    apiJson("/ai/generate-dictation", body ?? { topic: "daily life", count: 5 }),
  generateToeicQuiz: (body: {
    topic: string;
    part: number | string;
    count: number;
  }) => apiJson("/ai/generate-toeic-quiz", body),
  explainError: (
    questionId: number,
    body: {
      questionContent: string;
      userAnswer: string;
      correctAnswer: string;
    },
  ) => apiJson(`/ai/explain-toeic-error/${questionId}`, body),
  importEtsPdf: (pdfFile: File, audioFile?: File) => {
    const form = new FormData();
    form.append("pdfFile", pdfFile);
    if (audioFile) form.append("audioFile", audioFile);
    return apiFetch("/ai/import-ets-pdf", { method: "POST", body: form });
  },
};

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<UploadResult>("/upload", { method: "POST", body: form });
  },
  remove: (key: string) =>
    apiFetch(`/upload/${key}`, { method: "DELETE" }),
  presign: (key: string, mimeType: string, expiresIn?: number) => {
    const params = new URLSearchParams({ key, mimeType });
    if (expiresIn) params.set("expiresIn", String(expiresIn));
    return apiFetch(`/upload/presign?${params.toString()}`);
  },
};

export const gamificationApi = {
  leaderboard: () =>
    apiFetch<LeaderboardEntry[]>("/gamification/leaderboard", {
      auth: false,
    }),
  myBadges: () => apiFetch<UserBadge[] | Badge[]>("/gamification/badges/me"),
};
