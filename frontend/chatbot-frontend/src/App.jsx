import { Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import ChatBot from "./Pages/ChatBot";
import NavBar from "./components/NavBar";
import Dashboard from "./Pages/Dashboard";

function App() {
  

  return (
    <>
      <NavBar />
      <div className="mt-16"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatBot />} />
          <Route path="/dashboard" element={<Dashboard/>}/>
        </Routes>
      </div>
    </>
  );
}

export default App
