import React, { useState } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    if (auth && auth === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [auth]);

  if (!auth) {
    return <AuthMenu onAuth={setAuth} />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="App">
      <Navbar />
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
  );
}

export default App;