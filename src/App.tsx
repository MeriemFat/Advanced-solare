import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeClient from "./components/Clientpage/HomeClient";
import AdminPage from "./components/Adminpage/AdminPage";

function ClientLayout() {
  return (
    <>
      <Navbar />
      <HomeClient />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientLayout />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/Admin" element={<AdminPage />} />
        <Route path="/admine" element={<AdminPage />} />
        <Route path="/Admine" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/Admin/*" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;