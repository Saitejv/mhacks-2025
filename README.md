# Smart To-Do | MHacks 2025

A modern, full-stack task management application with intelligent time-based recommendations. Built with React frontend and Node.js backend.

![Smart To-Do Screenshot](https://github.com/user-attachments/assets/b251c9c6-65cc-41fe-b8dc-0d84f54e9f98)

## ✨ Features

- **Smart Task Management**: Create tasks with duration, priority, and dependencies
- **Intelligent Recommendations**: Get personalized task suggestions based on available time
- **Task Dependencies**: Set up task relationships and track blockers
- **Status Filtering**: View tasks by status (Available, Blocked, Completed)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant synchronization between frontend and backend
- **Persistent Storage**: Tasks are saved and maintained across sessions

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saitejv/mhacks-2025.git
   cd mhacks-2025
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend server will start on `http://localhost:5000`

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend/smart-todo-frontend
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

4. **Open your browser** and navigate to `http://localhost:5173`

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Port**: 5000
- **Database**: JSON file-based storage (easily upgradeable to SQL/NoSQL)
- **API**: RESTful endpoints with CORS support
- **Features**: Smart recommendation algorithm, data validation, error handling

### Frontend (React + Vite)
- **Framework**: React 18 with hooks
- **Build Tool**: Vite for fast development
- **Styling**: CSS modules with responsive design
- **State Management**: React hooks (useState, useEffect)
- **API Client**: Axios for backend communication

## 📋 API Endpoints

### Tasks
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Recommendations
- `POST /api/recommendations` - Get task recommendations for available time

## 🎯 How It Works

### Task Creation
1. **Title**: Descriptive task name
2. **Duration**: Estimated time in minutes
3. **Priority**: High, Medium, or Low
4. **Dependencies**: Optional prerequisite tasks

### Smart Recommendations
The recommendation algorithm considers:
- **Time Constraint**: Tasks that fit within available time
- **Priority Score**: Higher priority tasks get preference
- **Time Utilization**: Efficient use of available time
- **Age Factor**: Slight preference for older tasks
- **Dependencies**: Only suggests available (non-blocked) tasks

### Task States
- **Available**: Ready to work on (no pending dependencies)
- **Blocked**: Waiting on prerequisite tasks
- **Completed**: Finished tasks

## 🛠️ Development

### Project Structure
```
mhacks-2025/
├── backend/                 # Node.js backend
│   ├── server.js           # Express server and API routes
│   ├── data/tasks.json     # Data storage
│   └── package.json        # Backend dependencies
├── frontend/smart-todo-frontend/  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   └── package.json        # Frontend dependencies
└── README.md              # This file
```

### Available Scripts

**Backend:**
- `npm start` - Start the production server
- `npm run dev` - Start the development server

**Frontend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎮 Usage Examples

### Adding a Task
```javascript
// Example task creation
{
  "title": "Review project requirements",
  "duration": 15,
  "priority": "high",
  "dependencies": []
}
```

### Getting Recommendations
```javascript
// Request recommendations for 30 minutes
POST /api/recommendations
{
  "availableMinutes": 30
}

// Response
{
  "recommended": {
    "id": 123,
    "title": "Set up development environment",
    "duration": 30,
    "priority": "high"
  },
  "alternatives": [...]
}
```

## 🌟 Perfect For

- **Hackathon Participants**: Maximize productivity during time-constrained events
- **Students**: Break down projects into manageable, time-boxed tasks  
- **Professionals**: Make efficient use of short breaks between meetings
- **Anyone**: Who wants to match tasks to available time slots

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of MHacks 2025. See the repository for license details.

## 🔧 Technical Details

- **Frontend**: React 18, Vite, Axios, CSS3
- **Backend**: Node.js, Express.js, CORS, fs-extra
- **Data**: JSON file storage (production-ready for database upgrade)
- **Development**: Hot reload, modern ES6+ syntax, component-based architecture

---

*Built for MHacks 2025 - Turning spare minutes into productive wins* 🚀