import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const ViewTextMessages = forwardRef(({ classCode }, ref) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    refreshMessages: fetchMessages,
  }));

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/text-messages/${classCode}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [classCode]);

  if (loading) return <p className="text-gray-600">Loading messages...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">💬 Class Messages</h3>
      {messages.length === 0 ? (
        <p className="text-gray-600">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`rounded-lg p-4 shadow-md ${
                msg.senderRole === 'teacher' 
                  ? 'bg-blue-50 border-l-4 border-blue-600' 
                  : 'bg-green-50 border-l-4 border-green-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    msg.senderRole === 'teacher' 
                      ? 'bg-blue-200 text-blue-800' 
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {msg.senderRole === 'teacher' ? '👨‍🏫 TEACHER' : '👨‍🎓 STUDENT'}
                  </span>
                  <span className="font-semibold text-gray-800">{msg.senderName}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(msg.sentAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800 text-base">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ViewTextMessages.displayName = 'ViewTextMessages';
export default ViewTextMessages;
