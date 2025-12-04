import { useState, useEffect } from 'react';
import { X, Mic, MicOff, Loader } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { ParsedTaskData, VoiceParseResponse } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface VoiceInputModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const VoiceInputModal = ({ onClose, onSuccess }: VoiceInputModalProps) => {
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTaskData | null>(null);
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Completed'>('To Do');

  useEffect(() => {
    if (!isListening && transcript && transcript !== originalTranscript) {
      handleParseTranscript(transcript);
    }
  }, [isListening, transcript]);

  const handleParseTranscript = async (text: string) => {
    setIsParsing(true);
    setOriginalTranscript(text);

    try {
      const response = await api.post<VoiceParseResponse>('/voice/parse', {
        transcript: text
      });

      const { parsed, confidence: conf } = response.data;
      setParsedData(parsed);
      setConfidence(conf);

      // Set editable fields
      setTitle(parsed.title);
      setDescription(parsed.description || '');
      setPriority(parsed.priority);
      setStatus(parsed.status);
      
      if (parsed.dueDate) {
        const date = new Date(parsed.dueDate);
        setDueDate(format(date, 'yyyy-MM-dd'));
      } else {
        setDueDate('');
      }
      
      setDueTime(parsed.dueTime || '');

      toast.success('Voice command parsed successfully!');
    } catch (error) {
      toast.error('Failed to parse voice command');
      console.error('Parse error:', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsCreating(true);

    try {
      await api.post('/tasks', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        dueTime: dueTime || null,
        createdVia: 'voice'
      });

      toast.success('Task created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Create task error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartOver = () => {
    resetTranscript();
    setParsedData(null);
    setOriginalTranscript('');
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate('');
    setDueTime('');
    setStatus('To Do');
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Voice Recognition Not Supported</h3>
            <p className="text-gray-600 mb-4">
              Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Voice Task Creation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Voice Recording Section */}
          {!parsedData && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isParsing}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-primary-600 hover:bg-primary-700'
                  } ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isListening ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </button>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isListening ? 'Listening...' : 'Click to start recording'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Speak naturally about your task
                </p>
              </div>

              {transcript && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Transcript:</p>
                  <p className="text-gray-900">{transcript}</p>
                </div>
              )}

              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-primary-600">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Parsing your command...</span>
                </div>
              )}
            </div>
          )}

          {parsedData && (
            <div className="space-y-4">
              {/* Original Transcript */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Original Transcript:
                </p>
                <p className="text-blue-800">{originalTranscript}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-700">
                    Confidence: {confidence.toUpperCase()}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      confidence === 'high'
                        ? 'bg-green-500'
                        : confidence === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Additional details (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="input"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="input"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateTask}
                  disabled={isCreating || !title.trim()}
                  className="btn btn-primary flex-1"
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  onClick={handleStartOver}
                  disabled={isCreating}
                  className="btn btn-secondary"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceInputModal;
