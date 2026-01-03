'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  _count: { messages: number };
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  messagesLastDay: number;
  stats: Array<{ label: string; value: number }>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/auth/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.data);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: !isActive } : u
          )
        );
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگیری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* هدر */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">پنل مدیریت</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            خروج
          </button>
        </div>

        {/* آمار */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {stats.stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* جدول کاربران */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">لیست کاربران</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">ایمیل</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">نام</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">نقش</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">پیام‌ها</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">وضعیت</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'ادمین' : 'کاربر'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user._count.messages}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleUser(user.id, user.isActive)}
                        className={`px-3 py-1 rounded text-xs font-semibold text-white ${
                          user.isActive
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {user.isActive ? 'غیرفعال کن' : 'فعال کن'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
