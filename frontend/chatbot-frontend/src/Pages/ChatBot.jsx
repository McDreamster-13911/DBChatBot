import React, { useState } from "react";
import axios from "axios";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user's message to the chat
    const userMessage = { type: "user", text: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setIsLoading(true);

    try {
      // Send the natural language query to the new /sql-agent endpoint.
      const response = await axios.post("http://localhost:5000/sql-agent", {
        question: inputMessage,
      });

      // Extract the final answer from the response.
      const { final_answer } = response.data;
      const botMessage = { type: "bot", text: `Answer: ${final_answer}` };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      const errorMessage = { type: "bot", text: "Something went wrong!" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setInputMessage("");
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 p-4">
      <div className="text-xl font-semibold mb-2">
        Ask a natural language query about your database
      </div>
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-4 flex flex-col h-[70vh] border border-gray-300">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-[75%] ${
                message.type === "user"
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-gray-900 self-start"
              }`}
            >
              {message.text}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-200 text-gray-900 p-3 rounded-lg">
              Thinking...
            </div>
          )}
        </div>
        <div className="flex items-center border-t border-gray-300 p-2 mt-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Enter your query"
            className="flex-1 bg-gray-100 text-gray-900 p-2 rounded-lg outline-none border border-gray-300 focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            className="text-lg ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition hover:cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
