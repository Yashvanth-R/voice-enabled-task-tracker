import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
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
  rawResponse?: string;
}
