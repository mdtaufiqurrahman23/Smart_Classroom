import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudentAskQuestion({ classCode }) {
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [myQuestions, setMyQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allQnas, setAllQnas] = useState([]);
  const [expandedQnA, setExpandedQnA] = useState(null);

  useEffect(() => {
    fetchAllQnAs();
  }, [classCode]);

  const fetchAllQnAs = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/topicwise-qna/${classCode}`);
      setAllQnas(response.data || []);
    } catch (error) {
      console.error('Error fetching Q&As:', error);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!topic || !question) {
      alert('Please enter topic and question');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/topicwise-qna/create', {
        classCode,
        topic,
        question,
        askedBy: 'You' // TODO: Get student name from user context
      });
      alert('Question asked successfully!');
      setTopic('');
      setQuestion('');
      setMyQuestions([...myQuestions, response.data.qna]);
      await fetchAllQnAs();
    } catch (error) {
      console.error('Error asking question:', error);
      alert('Error asking question: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const unansweredQnAs = allQnas.filter(q => !q.answer);
  const answeredQnAs = allQnas.filter(q => q.answer);

  return (
    <div className="space-y-6">
      {/* Ask Question Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Ask a Question</h2>
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Topic:</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Mathematics, Science, History"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Your Question:</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question here..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Ask Question'}
          </button>
        </form>
      </div>

      {/* Unanswered Questions */}
      {unansweredQnAs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pending Answers ({unansweredQnAs.length})
          </h2>
          <div className="space-y-4">
            {unansweredQnAs.map((qna) => (
              <div key={qna._id} className="border-l-4 border-orange-600 p-4 rounded-lg shadow-sm bg-orange-50">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {qna.topic}
                      </span>
                      <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded">
                        Waiting for answer
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800">{qna.question}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Asked on: {new Date(qna.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered Questions */}
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
                  </div>
                  <button
                    onClick={() => setExpandedQnA(expandedQnA === qna._id ? null : qna._id)}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm whitespace-nowrap"
                  >
                    {expandedQnA === qna._id ? 'Hide' : 'View'}
                  </button>
                </div>

                {expandedQnA === qna._id && (
                  <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-semibold text-green-800 mb-2">Answer from Teacher:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{qna.answer}</p>
                    <p className="text-xs text-gray-500 mt-3">
                      Answered by: {qna.answeredBy}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {allQnas.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No questions asked yet. Be the first to ask!</p>
        </div>
      )}
    </div>
  );
}

export default StudentAskQuestion;
