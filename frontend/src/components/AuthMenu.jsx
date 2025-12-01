import React, { useState } from "react";

export function AuthMenu({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!isLogin && password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }
    // Dummy login/register
    if (isLogin) {
      if (email === "gegefans0@gmail.com" && password === "admin123") {
        onAuth({ role: "admin", email: email });
      } else {
        onAuth({ role: "user", email: email });
      }
    } else {
      onAuth({ role: "user", email: email });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-black">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-gray-800">
        <h2 className="mb-6 text-3xl font-bold text-indigo-400">{isLogin ? "Login" : "Create Account"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="mb-4">
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
