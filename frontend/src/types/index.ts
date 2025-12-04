export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string | null;
  dueTime?: string | null;
  createdVia: 'manual' | 'voice';
  createdAt: string;
  updatedAt: string;
}

export interface ParsedTaskData {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: Date | null;
  dueTime?: string | null;
  status: 'To Do' | 'In Progress' | 'Completed';
}

export interface VoiceParseResponse {
  transcript: string;
  parsed: ParsedTaskData;
  confidence: 'high' | 'medium' | 'low';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
