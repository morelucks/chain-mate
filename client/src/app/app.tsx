import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../components/pages/LandingPage";
import ChessScreen from "../components/pages/ChessScreen";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chess" element={<ChessScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;