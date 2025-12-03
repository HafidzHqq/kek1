import React, { useState } from "react";
import axios from "axios";
import { apiUrl } from "../lib/api";

export function AuthMenu({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth-v2/login' : '/api/auth-v2/register';
      const payload = isLogin 
        ? { email, password } 
        : { email, password, name };
      
      console.log('[AuthMenu] Attempting', isLogin ? 'login' : 'register', 'for:', email);
      
      const { data } = await axios.post(apiUrl(endpoint), payload);
      
      console.log('[AuthMenu] Response:', data.success ? 'Success' : 'Failed');
      
      if (data.success && data.token) {
        // Clear any old data first
        localStorage.clear();
        
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.user.email);
        
        console.log('[AuthMenu] Stored token and calling onAuth');
        
        onAuth({ 
          role: data.user.role, 
          email: data.user.email,
          name: data.user.name,
          token: data.token
        });
      } else {
        setError(data.error || 'Autentikasi gagal');
      }
    } catch (err) {
      console.error('[AuthMenu] Error:', err.response?.data || err.message);
      
      // Extract error message safely
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      
      if (err.response?.status === 401) {
        errorMessage = err.response?.data?.error || 'Email atau password salah';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || 'Data tidak valid';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-800">
        <h2 className="mb-6 text-3xl font-bold text-indigo-400">{isLogin ? "Login" : "Create Account"}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <input id="name" name="name" type="text" placeholder="Nama" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div className="mb-4">
            <input id="email" name="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="mb-4">
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={6} 
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
          </div>
          {error && <div className="text-red-400 mb-4 font-semibold">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-black text-white font-bold text-lg shadow-md hover:from-indigo-700 hover:via-purple-700 hover:to-gray-900 transition">{loading ? "Loading..." : isLogin ? "Login" : "Create Account"}</button>
        </form>
        <div className="mt-6">
          <button type="button" className="text-indigo-400 hover:underline" onClick={() => {
            setError('');
            setIsLogin(!isLogin);
          }}>
            {isLogin ? "Create an account" : "Already have an account? Login"}
          </button>
        </div>
        {error && (
          <div className="mt-4">
            <button 
              type="button" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Masih error? Klik di sini untuk reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
