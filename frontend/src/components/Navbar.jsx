import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ showDashboard = false, isLoggedIn = false, userName = '', onLoginClick, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Services', id: 'services' },
    { name: 'Portfolio', id: 'portfolio' },
    { name: 'Testimonials', id: 'testimonials' },
    { name: 'Pricing', id: 'pricing' }
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center cursor-pointer"
            onClick={() => scrollToSection('home')}
          >
            <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Inovatech
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                {link.name}
              </button>
            ))}
            <Button
              onClick={() => scrollToSection('contact')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6"
            >
              Contact Us
            </Button>
            
            {/* Login/User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <Button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-white/10 hover:bg-white/15 text-white rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <User size={18} />
                  <span className="max-w-[100px] truncate">{userName}</span>
                </Button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                    {showDashboard && (
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/chat')}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Live Chat
                    </button>
                    <hr className="my-2 border-gray-800" />
                    <button
                      onClick={() => { setShowUserMenu(false); onLogout(); }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={onLoginClick}
                className="bg-white/10 hover:bg-white/15 text-white rounded-full px-6 flex items-center gap-2"
              >
                <User size={18} />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800"
        >
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((link, index) => (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left text-gray-300 hover:text-white hover:bg-white/5 py-3 px-4 rounded-lg transition-all duration-200 font-medium"
              >
                {link.name}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navLinks.length * 0.1 }}
              className="pt-4 space-y-3"
            >
              <Button
                onClick={() => scrollToSection('contact')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full py-3 font-semibold shadow-lg shadow-purple-500/20"
              >
                Contact Us
              </Button>
              
              {isLoggedIn ? (
                <>
                  {showDashboard && (
                    <Button
                      onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }}
                      className="w-full bg-white/10 hover:bg-white/15 text-white rounded-full py-3 font-semibold"
                    >
                      Dashboard
                    </Button>
                  )}
                  <Button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/chat'); }}
                    className="w-full bg-white/10 hover:bg-white/15 text-white rounded-full py-3 font-semibold"
                  >
                    Live Chat
                  </Button>
                  <div className="text-center text-sm text-gray-400 py-2">
                    {userName}
                  </div>
                  <Button
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-full py-3 font-semibold flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                  className="w-full bg-white/10 hover:bg-white/15 text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2"
                >
                  <User size={18} />
                  Login
                </Button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};