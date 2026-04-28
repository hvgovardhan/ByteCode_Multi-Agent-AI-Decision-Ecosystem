import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Debate from "@/pages/Debate";
import History from "@/pages/History";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/debate/:debateId" element={<Debate />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}
