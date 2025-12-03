import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginRequired() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set a flag so App opens the login modal after redirect
    try {
      localStorage.setItem('showAuthModal', '1');
    } catch {}
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white">Redirecting to login…</div>
    </div>
  );
}
