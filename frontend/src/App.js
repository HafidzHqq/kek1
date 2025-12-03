import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from './lib/api';
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
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(apiUrl('/api/auth/verify'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.success && data.user) {
          setAuth({
            role: data.user.role,
            email: data.user.email,
            name: data.user.name,
            token
          });
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userEmail');
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (auth && auth.role === "admin") {
      setIsAdmin(true);
      setUserEmail(auth.email);
    } else if (auth) {
      setIsAdmin(false);
      setUserEmail(auth.email);
    }
  }, [auth]);

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await axios.post(apiUrl('/api/auth/logout'), {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setAuth(null);
    setUserEmail('');
    setIsAdmin(false);
  };

  const handleAuthSuccess = (authData) => {
    setAuth(authData);
    setShowAuthModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          isAdmin ? <AdminDashboard onLogout={handleLogout} /> :
          <div className="App bg-black min-h-screen">
            <Navbar 
              showDashboard={isAdmin} 
              isLoggedIn={!!auth}
              userName={auth?.name || auth?.email}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={handleLogout}
            />
            <div id="home">
              <Hero />
            </div>
            <div id="services">
              <Services />
            </div>
            <WhyUs />
            <div id="portfolio">
              <Portfolio />
            </div>
            <div id="testimonials">
              <Testimonials />
            </div>
            <div id="pricing">
              <Pricing />
            </div>
            <div id="contact">
              <Contact />
            </div>
            <Footer />
            <Toaster position="top-right" />
            
            {/* Auth Modal */}
            {showAuthModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="relative">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="absolute -top-4 -right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    ✕
                  </button>
                  <AuthMenu onAuth={handleAuthSuccess} />
                </div>
              </div>
            )}
          </div>
        } />
        <Route path="/admin" element={isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/" replace />} />
        <Route path="/chat" element={<Chat role={isAdmin ? 'admin' : 'user'} userEmail={userEmail} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;