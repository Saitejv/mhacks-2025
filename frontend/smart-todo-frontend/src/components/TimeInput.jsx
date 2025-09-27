import { useState } from 'react';

const TimeInput = ({ onGetRecommendation }) => {
  const [availableTime, setAvailableTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetRecommendation = async () => {
    if (!availableTime || availableTime <= 0) {
      alert('Please enter a valid time in minutes');
      return;
    }

    setIsLoading(true);
    try {
      const recommendations = await onGetRecommendation(parseInt(availableTime));
      
      // Dispatch a custom event to notify the RecommendationPanel
      window.dispatchEvent(new CustomEvent('recommendationsReceived', {
        detail: { recommendations, availableTime: parseInt(availableTime) }
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGetRecommendation();
    }
  };

  return (
    <section className="time-panel">
      <h2>Available Time</h2>
      <div className="time-input-group">
        <input
          type="number"
          id="available-time"
          placeholder="30"
          min="1"
          max="480"
          value={availableTime}
          onChange={(e) => setAvailableTime(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <span>minutes</span>
        <button
          id="get-recommendation"
          className="btn btn-primary"
          onClick={handleGetRecommendation}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Recommendation'}
        </button>
      </div>
    </section>
  );
};

export default TimeInput;