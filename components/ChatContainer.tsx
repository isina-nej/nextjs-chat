'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
}

interface OnlineUser {
  userId: string;
  email: string;
}

interface ChatContainerProps {
  token: string;
  userEmail: string;
}

export default function ChatContainer({ token, userEmail }: ChatContainerProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // بارگیری پیام‌های قدیمی
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.data.messages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [token]);

  // اتصال به Socket.io
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('user:join', token);
    });

    newSocket.on('message:new', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user:online', (data: { onlineUsers: OnlineUser[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    newSocket.on('user:offline', (data: { onlineUsers: OnlineUser[] }) => {
      setOnlineUsers(data.onlineUsers);
    });

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !imageUrl) {
      return;
    }

    if (socket) {
      socket.emit('message:send', {
        content: content.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });

      setContent('');
      setImageUrl(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.data.imageUrl);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">در حال بارگیری...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ساید بار - کاربران آنلاین */}
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">کاربران آنلاین ({onlineUsers.length})</h2>
        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <div key={user.userId} className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{user.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* اصلی - پیام‌ها */}
      <div className="flex-1 flex flex-col">
        {/* پیام‌ها */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              هیچ پیامی وجود ندارد
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user.email === userEmail ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs ${
                    message.user.email === userEmail
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-900'
                  } rounded-lg p-3`}
                >
                  {message.user.email !== userEmail && (
                    <p className="text-xs font-semibold mb-1">{message.user.name || message.user.email}</p>
                  )}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="message-image"
                      className="max-w-xs rounded mb-2"
                    />
                  )}
                  {message.content && <p>{message.content}</p>}
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString('fa-IR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* فرم ارسال */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-gray-200"
        >
          {imageUrl && (
            <div className="mb-3 relative">
              <img
                src={imageUrl}
                alt="preview"
                className="max-h-24 rounded"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
              📎
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </label>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ارسال
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
