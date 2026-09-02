import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TopicWiseQnA({ classCode, userRole }) {
  const [qnas, setQnas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQnA, setExpandedQnA] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    fetchQnAs();
  }, [classCode]);

  const fetchQnAs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/topicwise-qna/${classCode}`);
      setQnas(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching QnAs:', error);
      setError('Failed to fetch Q&A');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (qnaId) => {
    if (!answerText.trim()) {
      alert('Please enter an answer');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/topicwise-qna/${qnaId}`, {
        answer: answerText,
        answeredBy: 'Teacher' // TODO: Get from user context
      });
      alert('Answer posted successfully!');
      setAnswerText('');
      setAnsweringId(null);
      await fetchQnAs();
    } catch (error) {
      console.error('Error posting answer:', error);
      alert('Error posting answer');
    }
  };

  const handleDeleteQnA = async (qnaId) => {
    if (window.confirm('Are you sure you want to delete this Q&A?')) {
      try {
        await axios.delete(`http://localhost:5000/api/topicwise-qna/${qnaId}`);
        setQnas(qnas.filter(q => q._id !== qnaId));
      } catch (error) {
        alert('Error deleting Q&A');
      }
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !newTopic.trim()) {
      alert('Please enter both topic and question');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const studentName = userData?.name || userData?.email || 'Anonymous';

      await axios.post('http://localhost:5000/api/topicwise-qna/create', {
        classCode,
        topic: newTopic,
        question: newQuestion,
        askedBy: studentName
      });
      alert('Question submitted successfully!');
      setNewQuestion('');
      setNewTopic('');
      setAskingQuestion(false);
      await fetchQnAs();
    } catch (error) {
      console.error('Error asking question:', error);
      alert('Error submitting question: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <p className="text-gray-600">Loading Q&A...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  // Separate answered and unanswered questions
  const unansweredQnAs = qnas.filter(q => !q.answer);
  const answeredQnAs = qnas.filter(q => q.answer);

  return (
    <div className="space-y-6">
      {/* Student Question Form Section */}
      {userRole === 'student' && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ask a Question</h2>
          
          {!askingQuestion ? (
            <button
              onClick={() => setAskingQuestion(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              ✏️ Ask New Question
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Topic:</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g., Algebra, Physics, History"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Question:</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask your question here..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAskQuestion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  Submit Question
                </button>
                <button
                  onClick={() => {
                    setAskingQuestion(false);
                    setNewQuestion('');
                    setNewTopic('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Questions to Answer ({unansweredQnAs.length})
        </h2>
        {unansweredQnAs.length === 0 ? (
          <p className="text-gray-600">No pending questions.</p>
        ) : (
          <div className="space-y-4">
            {unansweredQnAs.map((qna) => (
              <div key={qna._id} className="border-l-4 border-orange-600 p-4 rounded-lg shadow-sm bg-orange-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {qna.topic}
                      </span>
                      <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded">
                        Pending Answer
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">{qna.question}</p>
                    <p className="text-xs text-gray-500 mt-1">Asked by: {qna.askedBy}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQnA(qna._id);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>

                {answeringId !== qna._id && (
                  <button
                    onClick={() => setAnsweringId(qna._id)}
                    className="mt-3 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                  >
                    Answer Question
                  </button>
                )}

                {answeringId === qna._id && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-300">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Enter your answer"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAnswerQuestion(qna._id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-sm"
                      >
                        Post Answer
                      </button>
                      <button
                        onClick={() => {
                          setAnsweringId(null);
                          setAnswerText('');
                        }}
                        className="flex-1 px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answered Questions Section */}
      {answeredQnAs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Answered Questions ({answeredQnAs.length})
          </h2>
          <div className="space-y-4">
            {answeredQnAs.map((qna) => (
              <div key={qna._id} className="border-l-4 border-green-600 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {qna.topic}
                      </span>
                      <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">
                        Answered
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">{qna.question}</p>
                    <p className="text-xs text-gray-500 mt-1">Asked by: {qna.askedBy}</p>
                  </div>
                  <button
                    onClick={() => setExpandedQnA(expandedQnA === qna._id ? null : qna._id)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    {expandedQnA === qna._id ? 'Hide' : 'Show'}
                  </button>
                </div>

                {expandedQnA === qna._id && (
                  <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-semibold text-green-800 mb-1">Answer:</p>
                    <p className="text-sm text-gray-700">{qna.answer}</p>
                    <p className="text-xs text-gray-500 mt-2">Answered by: {qna.answeredBy}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TopicWiseQnA;
