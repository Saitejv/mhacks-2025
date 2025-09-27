import React from 'react';

function renderTree(tasks) {
    const map = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));
    const roots = [];

    for (const task of map.values()) {
        if (task.dependencies && task.dependencies.length > 0) {
            for (const depId of task.dependencies) {
                const parent = map.get(depId);
                if (parent) parent.children.push(task);
            }
        } else {
            roots.push(task);
        }
    }

    const getTaskStatusIcon = (task) => {
        if (task.completed) return '✅';
        if (task.dependencies && task.dependencies.length > 0 && 
            task.dependencies.some(depId => {
                const dep = tasks.find(t => t.id === depId);
                return dep && !dep.completed;
            })) {
            return '🔒';
        }
        return '📋';
    };

    const renderNode = (node, level = 0) => (
        <div key={node.id} className="hierarchy-node" style={{ marginLeft: level * 20 }}>
            <div className="hierarchy-item">
                <span className="hierarchy-icon">{getTaskStatusIcon(node)}</span>
                <span className="hierarchy-title">{node.title || node.name || `Task ${node.id}`}</span>
                <div className="hierarchy-meta">
                    <span className={`hierarchy-priority priority-${node.priority}`}>
                        {node.priority}
                    </span>
                    <span className="hierarchy-duration">{node.duration}m</span>
                </div>
            </div>
            {node.children && node.children.length > 0 && (
                <div className="hierarchy-children">
                    {node.children.map(child => renderNode(child, level + 1))}
                </div>
            )}
        </div>
    );

    return roots.length ? (
        <div className="hierarchy-tree">
            {roots.map(r => renderNode(r))}
        </div>
    ) : (
        <div className="empty-state">
            <div className="empty-icon">🔗</div>
            <div className="empty-title">No task dependencies found</div>
            <div className="empty-description">Create tasks with dependencies to see the hierarchy chart here.</div>
        </div>
    );
}

export default function TaskHierarchy({ tasks }) {
    return (
        <div className="task-hierarchy">
            <div className="hierarchy-header">
                <h3>Task Dependency Chart</h3>
                <p>Visual representation of task relationships and dependencies</p>
            </div>
            {renderTree(tasks)}
        </div>
    );
}
