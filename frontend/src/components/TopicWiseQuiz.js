import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TopicWiseQuiz({ classCode, userRole }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, [classCode]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/topicwise-quiz/${classCode}`);
      setQuizzes(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const updated = [...questions];
    if (field === 'question') {
      updated[qIdx].question = value;
    } else if (field === 'correctAnswer') {
      updated[qIdx].correctAnswer = value;
    } else if (field.startsWith('option')) {
      const optIdx = parseInt(field.split('-')[1]);
      updated[qIdx].options[optIdx] = value;
    }
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!topic || questions.length === 0) {
      alert('Please enter topic and at least one question');
      return;
    }

    try {
      const payload = {
        classCode,
        topic,
        questions: questions.filter(q => q.question && q.options.some(opt => opt))
      };

      await axios.post('http://localhost:5000/api/topicwise-quiz/create', payload);
      alert('Quiz created successfully!');
      setTopic('');
      setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);
      await fetchQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`http://localhost:5000/api/topicwise-quiz/${quizId}`);
        setQuizzes(quizzes.filter(q => q._id !== quizId));
      } catch (error) {
        alert('Error deleting quiz');
      }
    }
  };

  if (loading) return <p className="text-gray-600">Loading quizzes...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      {userRole === 'teacher' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Topic-Wise Quiz</h2>
          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Topic:</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Questions</h3>
              {questions.map((q, qIdx) => (
              <div key={qIdx} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-700">Question {qIdx + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                  placeholder="Enter question"
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <div className="mb-3">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Options:</label>
                  {q.options.map((opt, oIdx) => (
                    <input
                      key={oIdx}
                      type="text"
                      value={opt}
                      onChange={(e) => handleQuestionChange(qIdx, `option-${oIdx}`, e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ))}
                </div>

                <input
                  type="text"
                  value={q.correctAnswer}
                  onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                  placeholder="Correct answer (must match one of the options)"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
            >
              Add Question
            </button>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            Create Quiz
          </button>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="text-gray-600">No quizzes yet.</p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="border-l-4 border-purple-600 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedQuiz(expandedQuiz === quiz._id ? null : quiz._id)}
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{quiz.topic}</h3>
                    <p className="text-sm text-gray-600">{quiz.questions.length} questions</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuiz(quiz._id);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    style={{ display: userRole === 'teacher' ? 'block' : 'none' }}
                  >
                    Delete
                  </button>
                </div>

                {expandedQuiz === quiz._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {quiz.questions.map((q, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold text-gray-800">{q.question}</p>
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <li
                              key={oIdx}
                              className={`text-sm ${q.correctAnswer === opt ? 'text-green-600 font-semibold' : 'text-gray-600'}`}
                            >
                              {opt} {q.correctAnswer === opt && '✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicWiseQuiz;
