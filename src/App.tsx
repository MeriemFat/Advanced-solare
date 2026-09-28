import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

        {/* Dashboard Routes */}
        <Route path="/dashbord" element={<AdminPage />} />
        <Route path="/Dashbord" element={<AdminPage />} />
        <Route path="/dashbord/*" element={<AdminPage />} />
        <Route path="/Dashbord/*" element={<AdminPage />} />

        {/* Dashboard alternative spelling */}
        <Route path="/dashboard" element={<AdminPage />} />
        <Route path="/Dashboard" element={<AdminPage />} />
        <Route path="/dashboard/*" element={<AdminPage />} />
        <Route path="/Dashboard/*" element={<AdminPage />} />

        {/* Redirect /admin to /dashbord */}
        <Route path="/admin" element={<Navigate to="/dashbord" replace />} />
        <Route path="/Admin" element={<Navigate to="/dashbord" replace />} />
        <Route path="/admine" element={<Navigate to="/dashbord" replace />} />
        <Route path="/Admine" element={<Navigate to="/dashbord" replace />} />
        <Route path="/admin/*" element={<Navigate to="/dashbord" replace />} />
        <Route path="/Admin/*" element={<Navigate to="/dashbord" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;