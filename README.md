# Voice-Enabled Task Tracker

A full-stack task management application with intelligent voice input capabilities powered by AI.

## Key Features

### Voice Input (Core Feature)
- **Natural Language Processing**: Speak naturally to create tasks
- **Intelligent Parsing**: AI extracts title, due date, priority, and status
- **Flexible Date Understanding**: "tomorrow", "next Monday", "in 3 days", "January 15"
- **Priority Detection**: Recognizes "urgent", "high priority", "low priority"
- **Review Before Save**: Edit parsed data before creating tasks
- **Confidence Levels**: Shows AI parsing confidence (high/medium/low)

### Task Management
- **Manual Creation**: Traditional form-based task creation
- **Real-time Updates**: Live sync across all browser tabs
- **Kanban Board**: Three columns (To Do, In Progress, Completed)
- **Full CRUD**: Create, Read, Update, Delete operations
- **Priority Colors**: Visual priority indicators
- **Due Date Tracking**: Calendar-based due dates

### Security & Auth
- JWT-based authentication
- Secure password hashing
- User data isolation
- Protected API routes

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Web Speech API** for voice recognition
- **Socket.io-client** for real-time updates
- **Axios** for HTTP requests
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with **Prisma ORM**
- **Socket.io** for real-time communication
- **Hugging Face AI** (Mistral-7B) for intelligent parsing - **FREE!**
- **JWT** authentication
- **Zod** for validation
