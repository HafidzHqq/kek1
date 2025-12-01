import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import './App.css';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { WhyUs } from './components/WhyUs';
import { Portfolio } from './components/Portfolio';
import { Testimonials } from './components/Testimonials';
import { Pricing } from './components/Pricing';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { AuthMenu } from './components/AuthMenu';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const [auth, setAuth] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    if (auth && auth.role === "admin") {
      setIsAdmin(true);
      setUserEmail(auth.email);
    } else if (auth) {
      setIsAdmin(false);
      setUserEmail(auth.email);
    }
  }, [auth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          !auth ? <AuthMenu onAuth={setAuth} /> :
          isAdmin ? <AdminDashboard onLogout={() => setAuth(null)} /> :
          <div className="App">
            <Navbar showDashboard={isAdmin} />
            <Hero />
            <Services />
            <WhyUs />
            <Portfolio />
            <Testimonials />
            <Pricing />
            <Contact />
            <Footer />
            <Toaster position="top-right" />
          </div>
        } />
        <Route path="/admin" element={isAdmin ? <AdminDashboard onLogout={() => { setAuth(null); setUserEmail(''); }} /> : <Navigate to="/" replace />} />
        <Route path="/chat" element={<Chat role={isAdmin ? 'admin' : 'user'} userEmail={userEmail} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;