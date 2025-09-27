# Smart To-Do | MHacks 2025

A minimalist to-do app with intelligent time-based task recommendations. Perfect for making the most of short time slots and managing task dependencies.

## Features

### Core Functionality
- **Task Management**: Create tasks with estimated duration, priority levels (Low/Medium/High), and dependencies
- **Smart Recommendations**: Enter available time and get intelligent task suggestions based on duration, priority, and dependencies  
- **Dependency Tracking**: Visual indication of blocked vs. available tasks
- **Time-Based Filtering**: Recommends tasks that fit perfectly within your available time slot

### Key Benefits
- **Maximizes Productivity**: Turn spare minutes into meaningful progress
- **Prevents Overwhelm**: Clear visual distinction between actionable and blocked tasks
- **Smart Prioritization**: Algorithm considers urgency, priority, and time efficiency
- **Quick Task Creation**: Streamlined interface for fast task entry

## How It Works

1. **Add Tasks**: Create tasks with title, estimated duration, priority, and any dependencies
2. **Enter Available Time**: Input how many minutes you have free (e.g., 30 minutes)
3. **Get Recommendations**: The app suggests the best task to tackle based on:
   - Tasks that fit within your time slot
   - Unblocked tasks (all dependencies completed)
   - Priority level and urgency
   - Optimal time utilization

4. **Track Progress**: Mark tasks complete and watch dependencies unlock automatically

## Getting Started

Simply open `index.html` in your web browser. The app includes sample tasks to demonstrate functionality.

### Sample Workflow
1. Enter "30" in the available time field
2. Click "Get Recommendation" to see the best task for a 30-minute slot
3. Add your own tasks using the form
4. Set dependencies to create task chains
5. Filter tasks by status: All, Available, Blocked, or Completed

## Technical Details

- **Pure Web Technologies**: HTML, CSS, JavaScript (no frameworks)
- **Local Storage**: Tasks persist in browser storage
- **Responsive Design**: Works on desktop and mobile
- **Recommendation Algorithm**: Scores tasks based on priority, time efficiency, and age

## Perfect For

- **Hackathon Participants**: Maximize limited time during events
- **Students**: Break down projects into manageable, time-boxed tasks
- **Professionals**: Make productive use of short breaks between meetings
- **Anyone**: Who wants to match the right task to available time

---
*Built for MHacks 2025 - Turning spare minutes into productive wins*