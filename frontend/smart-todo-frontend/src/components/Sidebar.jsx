import React from 'react';

export default function Sidebar({ currentPage, onNavigate, isSignedIn, currentUser, onSignInToggle }) {
    return (
        <div className="side-panel">
            <div className="side-brand">
                <h2>Menu</h2>
                {currentUser && (
                    <p className="user-info">
                        <small>Signed in as {currentUser.username}</small>
                    </p>
                )}
            </div>

            <nav className="side-nav">
                <button
                    className={`side-link ${currentPage === 'choose-tasks' ? 'active' : ''}`}
                    onClick={() => onNavigate('choose-tasks')}
                >
                    Choose Tasks
                </button>

                <button
                    className={`side-link ${currentPage === 'add-task' ? 'active' : ''}`}
                    onClick={() => onNavigate('add-task')}
                >
                    Add Task
                </button>

                <button
                    className={`side-link ${currentPage === 'hierarchy' ? 'active' : ''}`}
                    onClick={() => onNavigate('hierarchy')}
                >
                    View Task Hierarchy
                </button>
            </nav>

            <div className="side-footer">
                <button className="btn small" onClick={onSignInToggle}>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
