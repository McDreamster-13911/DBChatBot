import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; 


const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-wide ">
         <Link to={"/"}>AI<span className="text-blue-400">ChatBot</span>    </Link> 
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center space-x-8 text-lg">
          <li>
            <Link
              to="/"
              className="hover:text-blue-400 transition-colors"
              aria-label="Go to Homepage"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/chat"
              className="hover:text-blue-400 transition-colors"
              aria-label="Query Chatbot"
            >
              Chat
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="hover:text-blue-400 transition-colors"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Link>
          </li>
        </ul>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="md:hidden flex flex-col items-center bg-gray-800 py-4 mt-2 space-y-4 text-lg">
          <li>
            <Link
              to="/"
              className="hover:text-blue-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/chat"
              className="hover:text-blue-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Chat
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="hover:text-blue-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default NavBar;
