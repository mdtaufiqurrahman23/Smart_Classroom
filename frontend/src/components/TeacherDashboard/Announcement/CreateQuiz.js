// frontend/src/components/TeacherDashboard/CreateQuiz.js
import React, { useState } from 'react';
import axios from 'axios';

function CreateQuiz() {
  const [classCode, setClassCode] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/topic-wise-quiz/create', { classCode, topic, questions });
      alert('Quiz created successfully!');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz');
    }
  };

  return (
    <div>
      <h2>Create Topic-wise Quiz</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Class Code:</label>
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Topic:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </div>
        <div>
          <h3>Questions</h3>
          {questions.map((question, index) => (
            <div key={index}>
              <input
                type="text"
                placeholder="Question"
                value={question.question}
                onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                required
              />
              {question.options.map((option, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updatedOptions = [...question.options];
                    updatedOptions[idx] = e.target.value;
                    handleQuestionChange(index, 'options', updatedOptions);
                  }}
                />
              ))}
              <input
                type="text"
                placeholder="Correct Answer"
                value={question.correctAnswer}
                onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                required
              />
              <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== index))}>Remove Question</button>
            </div>
          ))}
          <button type="button" onClick={handleAddQuestion}>Add Question</button>
        </div>
        <button type="submit">Create Quiz</button>
      </form>
    </div>
  );
}

export default CreateQuiz;
