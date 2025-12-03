import axios from 'axios';
import { ParsedTaskData, VoiceParseResponse } from '../types';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export class VoiceService {
  async parseVoiceCommand(transcript: string): Promise<VoiceParseResponse> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const prompt = `<s>[INST] You are a task parsing assistant. Parse the following voice command and extract task information.

Voice Command: "${transcript}"

Current date: ${currentDate}
Current time: ${currentTime}

Extract:
1. Title: Clean task description (capitalize first letter, remove "create", "add", "task to" prefixes)
2. Due Date: Parse dates (tomorrow, next Monday, in 3 days, January 15, etc.)
3. Due Time: Extract time from phrases like "evening" (18:00), "morning" (09:00), "afternoon" (14:00), "night" (20:00), or specific times
4. Priority: urgent/critical=Urgent, high/important=High, low=Low, default=Medium
5. Status: Always "To Do"

Time mappings:
- morning = 09:00
- afternoon = 14:00
- evening = 18:00
- night = 20:00
- noon = 12:00
- midnight = 00:00

Return ONLY valid JSON (no markdown):
{
  "title": "Clean task title with proper capitalization",
  "description": null,
  "priority": "Low|Medium|High|Urgent",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM or null",
  "status": "To Do",
  "confidence": "high|medium|low"
}
[/INST]`;

      const response = await axios.post(
        HUGGINGFACE_API_URL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.3,
            top_p: 0.9,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      let responseText = '';
      if (Array.isArray(response.data) && response.data[0]?.generated_text) {
        responseText = response.data[0].generated_text;
      } else if (response.data?.generated_text) {
        responseText = response.data.generated_text;
      }

      // Clean and extract JSON
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // Fallback parsing using regex
        parsed = this.fallbackParsing(transcript);
      }

      // Validate and normalize the response
      const taskData: ParsedTaskData = {
        title: this.cleanTitle(parsed.title || transcript),
        description: parsed.description || undefined,
        priority: this.normalizePriority(parsed.priority),
        dueDate: this.parseDateFromText(parsed.dueDate || '', transcript),
        dueTime: parsed.dueTime || this.extractTimeFromText(transcript),
        status: parsed.status || 'To Do'
      };

      return {
        transcript,
        parsed: taskData,
        confidence: parsed.confidence || 'medium',
        rawResponse: responseText
      };
    } catch (error) {
      console.error('Error parsing voice command:', error);
      
      // Enhanced fallback parsing
      return this.enhancedFallbackParsing(transcript);
    }
  }

  private fallbackParsing(transcript: string): any {
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract priority
    let priority = 'Medium';
    if (lowerTranscript.includes('urgent') || lowerTranscript.includes('critical')) {
      priority = 'Urgent';
    } else if (lowerTranscript.includes('high') || lowerTranscript.includes('important')) {
      priority = 'High';
    } else if (lowerTranscript.includes('low')) {
      priority = 'Low';
    }

    // Extract time
    let dueTime = null;
    if (lowerTranscript.includes('evening')) dueTime = '18:00';
    else if (lowerTranscript.includes('morning')) dueTime = '09:00';
    else if (lowerTranscript.includes('afternoon')) dueTime = '14:00';
    else if (lowerTranscript.includes('night')) dueTime = '20:00';
    else if (lowerTranscript.includes('noon')) dueTime = '12:00';
    else if (lowerTranscript.includes('midnight')) dueTime = '00:00';

    // Extract title (remove common prefixes and clean up)
    let title = transcript
      .replace(/^(create|add|make|new)\s+(a\s+)?(task\s+)?(to\s+)?/i, '')
      .replace(/,?\s*(urgent|high|low|medium)\s*priority/i, '')
      .replace(/,?\s*by\s+(tomorrow|today|next\s+\w+|in\s+\d+\s+days?)/i, '')
      .replace(/,?\s*(tomorrow|today|next\s+\w+|in\s+\d+\s+days?)/i, '')
      .replace(/,?\s*(evening|morning|afternoon|night|noon|midnight)/i, '')
      .trim();

    // Capitalize first letter
    if (title) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      title = transcript;
    }

    return {
      title,
      priority,
      dueDate: null,
      dueTime,
      status: 'To Do',
      confidence: 'low'
    };
  }

  private enhancedFallbackParsing(transcript: string): VoiceParseResponse {
    const parsed = this.fallbackParsing(transcript);
    const dueDate = this.parseDateFromText('', transcript);

    return {
      transcript,
      parsed: {
        title: parsed.title,
        priority: this.normalizePriority(parsed.priority),
        status: 'To Do',
        dueDate,
        dueTime: parsed.dueTime
      },
      confidence: 'low'
    };
  }

  private cleanTitle(title: string): string {
    // Remove common prefixes
    let cleaned = title
      .replace(/^(create|add|make|new)\s+(a\s+)?(task\s+)?(to\s+)?/i, '')
      .replace(/,?\s*(urgent|high|low|medium)\s*priority/i, '')
      .replace(/,?\s*by\s+(tomorrow|today|next\s+\w+|in\s+\d+\s+days?)/i, '')
      .replace(/,?\s*(tomorrow|today|next\s+\w+|in\s+\d+\s+days?)/i, '')
      .replace(/,?\s*(evening|morning|afternoon|night|noon|midnight)/i, '')
      .trim();

    // Capitalize first letter
    if (cleaned) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    } else {
      cleaned = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return cleaned;
  }

  private extractTimeFromText(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Time of day mappings
    if (lowerText.includes('evening')) return '18:00';
    if (lowerText.includes('morning')) return '09:00';
    if (lowerText.includes('afternoon')) return '14:00';
    if (lowerText.includes('night')) return '20:00';
    if (lowerText.includes('noon')) return '12:00';
    if (lowerText.includes('midnight')) return '00:00';
    
    // Specific time patterns (e.g., "at 3pm", "at 15:00")
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    const match = lowerText.match(timePattern);
    
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const meridiem = match[3]?.toLowerCase();
      
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return null;
  }

  private normalizePriority(priority: string): 'Low' | 'Medium' | 'High' | 'Urgent' {
    const normalized = priority?.toLowerCase() || 'medium';
    
    if (normalized.includes('urgent') || normalized.includes('critical')) {
      return 'Urgent';
    }
    if (normalized.includes('high') || normalized.includes('important')) {
      return 'High';
    }
    if (normalized.includes('low')) {
      return 'Low';
    }
    return 'Medium';
  }

  parseDateFromText(dateText: string, fullTranscript?: string): Date | null {
    const textToSearch = fullTranscript ? `${dateText} ${fullTranscript}`.toLowerCase() : dateText.toLowerCase();
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lowerText = textToSearch;

      // Relative dates
      if (lowerText.includes('today')) {
        return today;
      }
      
      if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }

      // "in X days"
      const inDaysMatch = lowerText.match(/in (\d+) days?/);
      if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1]);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        return futureDate;
      }

      // "next Monday", "next week", etc.
      if (lowerText.includes('next')) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayMatch = days.find(day => lowerText.includes(day));
        
        if (dayMatch) {
          const targetDay = days.indexOf(dayMatch);
          const currentDay = today.getDay();
          let daysToAdd = targetDay - currentDay;
          
          if (daysToAdd <= 0) {
            daysToAdd += 7;
          }
          
          const nextDate = new Date(today);
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          return nextDate;
        }
      }

      // Try parsing as standard date
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export default new VoiceService();
