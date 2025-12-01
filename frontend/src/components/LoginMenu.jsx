import React, { useState } from "react";

export function LoginMenu({ onLogin }) {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role || !username || !password) {
      setError("Semua field harus diisi.");
      return;
    }
    // Dummy login logic
    if (role === "user" && username === "user" && password === "userpass") {
      onLogin("user");
    } else if (role === "developer" && username === "dev" && password === "devpass") {
      onLogin("developer");
    } else {
      setError("Login gagal. Cek username/password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-black">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-gray-800">
        <h2 className="mb-6 text-3xl font-bold text-indigo-400">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-center gap-8">
            <label className="font-medium text-purple-300">
              <input type="radio" name="role" value="user" checked={role === "user"} onChange={() => setRole("user")} className="accent-indigo-500 mr-2" /> User
            </label>
            <label className="font-medium text-blue-300">
              <input type="radio" name="role" value="developer" checked={role === "developer"} onChange={() => setRole("developer")} className="accent-purple-500 mr-2" /> Developer
            </label>
          </div>
          <div className="mb-4">
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="mb-4">
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          {error && <div className="text-red-400 mb-4 font-semibold">{error}</div>}
          <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-black text-white font-bold text-lg shadow-md hover:from-indigo-700 hover:via-purple-700 hover:to-gray-900 transition">Login</button>
        </form>
      </div>
    </div>
  );
}
