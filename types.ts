export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, never store plain text, but here we simulate
  name: string;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  content: string;
  genre: string;
  createdAt: number;
  prompt: string;
  audioBase64?: string;
}

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD_CREATE = 'DASHBOARD_CREATE',
  DASHBOARD_SAVED = 'DASHBOARD_SAVED'
}

export enum StoryGenre {
  FANTASY = 'خیال‌پردازی',
  SCI_FI = 'علمی تخیلی',
  FABLE = 'افسانه',
  ADVENTURE = 'ماجراجویی',
  BEDTIME = 'قصه‌ی شب',
  EDUCATIONAL = 'آموزشی'
}

export interface StoryOptions {
  prompt: string;
  genre: StoryGenre;
  ageGroup: string;
  length: 'short' | 'medium' | 'long';
}