import { useState, useEffect } from 'react';

const RecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [availableTime, setAvailableTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleRecommendations = (e) => {
      const { recommendations, availableTime } = e.detail;
      setRecommendations(recommendations);
      setAvailableTime(availableTime);
      setIsVisible(true);
    };

    window.addEventListener('recommendationsReceived', handleRecommendations);
    
    return () => {
      window.removeEventListener('recommendationsReceived', handleRecommendations);
    };
  }, []);

  const TaskCard = ({ task, isRecommended = false }) => (
    <div className={`task-recommendation-card ${isRecommended ? 'recommended' : 'alternative'}`}>
      <h4>{task.title}</h4>
      <div className="task-details">
        <span className={`priority priority-${task.priority}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
        <span className="duration">{task.duration} minutes</span>
      </div>
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="dependencies">
          <small>Dependencies: {task.dependencies.length} task(s)</small>
        </div>
      )}
    </div>
  );

  if (!isVisible) return null;

  return (
    <section className="recommendation-panel" id="recommendation-panel">
      <div className="recommendation-header">
        <h2>Recommendations for {availableTime} minutes</h2>
        <button 
          className="close-btn" 
          onClick={() => setIsVisible(false)}
          aria-label="Close recommendations"
        >
          ×
        </button>
      </div>
      
      {recommendations?.recommended ? (
        <>
          <div id="recommended-task" className="task-recommendation">
            <h3>Best Match</h3>
            <TaskCard task={recommendations.recommended} isRecommended={true} />
          </div>
          
          {recommendations.alternatives && recommendations.alternatives.length > 0 && (
            <div id="alternative-tasks" className="alternative-tasks">
              <h3>Alternatives</h3>
              <div className="alternatives-grid">
                {recommendations.alternatives.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-recommendations">
          <h3>No suitable tasks found</h3>
          <p>
            No tasks can be completed in {availableTime} minutes. 
            Try increasing the time or completing some task dependencies.
          </p>
        </div>
      )}
    </section>
  );
};

export default RecommendationPanel;