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
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email, password } 
        : { email, password, name };
      
      const { data } = await axios.post(apiUrl(endpoint), payload);
      
      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.user.email);
        
        onAuth({ 
          role: data.user.role, 
          email: data.user.email,
          name: data.user.name,
          token: data.token
        });
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Extract error message safely
      const errorMessage = err.response?.data?.error 
        || err.message 
        || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(String(errorMessage));
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
              <input type="text" placeholder="Nama" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div className="mb-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="mb-4">
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          {error && <div className="text-red-400 mb-4 font-semibold">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-black text-white font-bold text-lg shadow-md hover:from-indigo-700 hover:via-purple-700 hover:to-gray-900 transition">{loading ? "Loading..." : isLogin ? "Login" : "Create Account"}</button>
        </form>
        <div className="mt-6">
          <button type="button" className="text-indigo-400 hover:underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create an account" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
