import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate("/chat");
  };

  return (
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-0 md:justify-between px-4 py-4 md:p-8 h-screen">
      {/* Image Section - Order first on mobile, second on desktop */}
      <div className="w-full md:w-1/2 md:order-2 flex justify-center h-1/2 md:h-auto">
        <img
          src="/chatbot_homepage_img.png"
          alt="Chatbot Homepage"
          className="w-full max-w-md md:w-3/4 h-auto mx-auto md:ml-16"
        />
      </div>

      {/* Text Content Section - Order second on mobile, first on desktop */}
      <div className="w-full md:w-1/2 px-0 md:px-4 md:order-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 md:mb-6 leading-tight">
          Welcome to AI ChatBot
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-4 md:mb-12 max-w-xl mx-auto md:mx-0">
          Instant Answers, Smarter Decisions – Your AI-powered partner for
          supplier & product insights!
        </p>
        <div className="flex justify-center md:justify-start">
          <button
            onClick={handleGetStartedClick}
            className="shadow-[inset_0_0_0_2px_#616467] px-8 py-3 md:px-12 md:py-4 rounded-full uppercase font-bold bg-transparent hover:bg-[#f9f8ff] hover:text-blue-400 transition duration-200 text-base md:text-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;