import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const ViewPolls = forwardRef(({ classCode, userRole }, ref) => {
  const [polls, setPolls] = useState([]);
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [votedPolls, setVotedPolls] = useState(new Set());

  useImperativeHandle(ref, () => ({
    refreshPolls: fetchPolls,
  }));

  useEffect(() => {
    // Load voted polls from localStorage on mount
    const storedVotes = localStorage.getItem(`votedPolls_${classCode}`);
    if (storedVotes) {
      setVotedPolls(new Set(JSON.parse(storedVotes)));
    }
    fetchPolls();
  }, [classCode]);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/polls/${classCode}`);
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/polls/${pollId}`);
      alert('Poll deleted successfully!');
      setPolls(polls.filter((poll) => poll._id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Error deleting poll');
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    if (votedPolls.has(pollId)) {
      alert('You have already voted on this poll!');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/polls/vote', {
        pollId,
        optionIndex
      });
      alert('Vote submitted successfully!');
      const updated = new Set(votedPolls);
      updated.add(pollId);
      setVotedPolls(updated);
      // Persist voted polls to localStorage per class
      localStorage.setItem(`votedPolls_${classCode}`, JSON.stringify(Array.from(updated)));
      await fetchPolls();
    } catch (error) {
      console.error('Error voting on poll:', error);
      alert('Error submitting vote');
    }
  };

  if (loading) return <p className="text-gray-600">Loading polls...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Polls</h3>
      {polls.length === 0 ? (
        <p className="text-gray-600">No polls created yet.</p>
      ) : (
        polls.map((poll) => (
          <div
            key={poll._id}
            className="bg-white border-l-4 border-blue-600 rounded-lg p-6 shadow-md"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                  {poll.question}
                </h4>
                <button
                  onClick={() =>
                    setExpandedPoll(expandedPoll === poll._id ? null : poll._id)
                  }
                  className="text-blue-600 hover:text-blue-800 font-semibold mb-3"
                >
                  {expandedPoll === poll._id ? '▼ Hide Options' : '▶ Show Options'}
                </button>

                {expandedPoll === poll._id && (
                  <div className="mt-4 space-y-2">
                    {poll.options.map((option, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 p-3 rounded-lg flex justify-between items-center"
                      >
                        <span className="text-gray-700">
                          {typeof option === 'string' ? option : option.option}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                            {typeof option === 'string' 
                              ? (poll.votes && poll.votes[index] ? `${poll.votes[index]} votes` : '0 votes')
                              : `${option.votes || 0} votes`
                            }
                          </span>
                          <button
                            onClick={() => handleVote(poll._id, index)}
                            disabled={votedPolls.has(poll._id) || userRole === 'teacher'}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {votedPolls.has(poll._id) ? '✓ Voted' : 'Vote'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeletePoll(poll._id)}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                style={{ display: userRole === 'teacher' ? 'block' : 'none' }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
});

ViewPolls.displayName = 'ViewPolls';
export default ViewPolls;
