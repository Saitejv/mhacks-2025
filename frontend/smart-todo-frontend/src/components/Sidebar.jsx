import React, { useState } from 'react';

export default function Sidebar({ 
    currentPage, 
    onNavigate, 
    isSignedIn, 
    onSignInToggle, 
    tasks = [], 
    onCreateTask 
}) {
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuickTaskSubmit = async (e) => {
        e.preventDefault();
        if (!quickTaskTitle.trim() || !onCreateTask) return;

        setIsSubmitting(true);
        try {
            await onCreateTask({
                title: quickTaskTitle.trim(),
                duration: 30, // Default 30 minutes
                priority: 'medium', // Default priority
                dependencies: []
            });
            setQuickTaskTitle('');
        } catch (error) {
            console.error('Error creating quick task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDependencySummary = () => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const blockedTasks = tasks.filter(task => 
            task.dependencies && task.dependencies.length > 0 && 
            !task.completed &&
            task.dependencies.some(depId => {
                const dependency = tasks.find(t => t.id === depId);
                return dependency && !dependency.completed;
            })
        ).length;
        
        return { totalTasks, completedTasks, blockedTasks };
    };

    const summary = getDependencySummary();

    return (
        <div className="side-panel">
            <div className="side-brand">
                <h2>📋 Smart To-Do</h2>
            </div>

            {/* Navigation Section */}
            <div className="side-section">
                <h3 className="side-section-title">Navigation</h3>
                <nav className="side-nav">
                    <button
                        className={`side-link ${currentPage === 'choose-tasks' ? 'active' : ''}`}
                        onClick={() => onNavigate('choose-tasks')}
                    >
                        📝 Tasks
                    </button>

                    <button
                        className={`side-link ${currentPage === 'add-task' ? 'active' : ''}`}
                        onClick={() => onNavigate('add-task')}
                    >
                        ➕ Add Task
                    </button>

                    <button
                        className={`side-link ${currentPage === 'hierarchy' ? 'active' : ''}`}
                        onClick={() => onNavigate('hierarchy')}
                    >
                        🔗 Dependency Chart
                    </button>
                </nav>
            </div>

            {/* Quick Add Task Section */}
            <div className="side-section">
                <h3 className="side-section-title">Quick Add</h3>
                <form onSubmit={handleQuickTaskSubmit} className="quick-task-form">
                    <input
                        type="text"
                        placeholder="Quick task title..."
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        className="quick-task-input"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        className="quick-task-btn"
                        disabled={!quickTaskTitle.trim() || isSubmitting}
                    >
                        {isSubmitting ? '⏳' : '✅'}
                    </button>
                </form>
                <small className="quick-task-hint">
                    Adds with default settings (30min, medium priority)
                </small>
            </div>

            {/* Task Overview Section */}
            <div className="side-section">
                <h3 className="side-section-title">Overview</h3>
                <div className="task-overview">
                    <div className="overview-item">
                        <span className="overview-label">Total Tasks:</span>
                        <span className="overview-value">{summary.totalTasks}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">Completed:</span>
                        <span className="overview-value completed">{summary.completedTasks}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">Blocked:</span>
                        <span className="overview-value blocked">{summary.blockedTasks}</span>
                    </div>
                    <div className="overview-item">
                        <span className="overview-label">Available:</span>
                        <span className="overview-value available">{summary.totalTasks - summary.completedTasks - summary.blockedTasks}</span>
                    </div>
                </div>
                {currentPage !== 'hierarchy' && summary.totalTasks > 0 && (
                    <button 
                        className="mini-hierarchy-btn"
                        onClick={() => onNavigate('hierarchy')}
                    >
                        🔗 View Dependencies
                    </button>
                )}
            </div>

            <div className="side-footer">
                <button className="btn small" onClick={onSignInToggle}>
                    {isSignedIn ? '🔓 Sign Out' : '🔒 Sign In'}
                </button>
            </div>
        </div>
    );
}
