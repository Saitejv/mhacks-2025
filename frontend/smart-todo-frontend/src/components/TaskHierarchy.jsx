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

    const renderNode = (node, level = 0) => (
        <div key={node.id} style={{ marginLeft: level * 12 }} className="hierarchy-node">
            <div className="hierarchy-title">{node.title || node.name || `Task ${node.id}`}</div>
            {node.children && node.children.map(child => renderNode(child, level + 1))}
        </div>
    );

    return roots.length ? roots.map(r => renderNode(r)) : <div className="empty-state">No hierarchy available</div>;
}

export default function TaskHierarchy({ tasks }) {
    return (
        <div className="task-hierarchy">
            {renderTree(tasks)}
        </div>
    );
}
