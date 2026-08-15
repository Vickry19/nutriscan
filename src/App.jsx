import {Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Result from "./pages/Result";
import BarcodeScanner from "./pages/Barcode";
import Profile from "./pages/Profile";
import History from "./pages/History";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/result" element={<Result />} />
        <Route path="/barcode" element={<BarcodeScanner />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
      </Routes>

  );
}

export default App;