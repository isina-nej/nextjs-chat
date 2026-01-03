'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatContainer from '@/components/ChatContainer';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // دریافت اطلاعات از localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/auth/login');
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگیری...</div>;
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className="relative h-screen">
      {/* دکمه خروج */}
      <button
        onClick={handleLogout}
        className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 z-50"
      >
        خروج
      </button>

      {/* صفحه چت */}
      <ChatContainer token={token} userEmail={user.email} />
    </div>
  );
}
