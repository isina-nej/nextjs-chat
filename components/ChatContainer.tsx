'use client';

import React, { useEffect, useState, useRef } from 'react';

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

interface ChatContainerProps {
  token: string;
  userEmail: string;
}

export default function ChatContainer({ token, userEmail }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !imageUrl) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim() || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });

      if (response.ok) {
        setContent('');
        setImageUrl(null);
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('Message deleted successfully');
        await fetchMessages();
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', response.status, errorData);
        alert('Error deleting message: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + String(error));
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditContent('');
        console.log('Message updated successfully');
        await fetchMessages();
      } else {
        const errorData = await response.json();
        console.error('Edit failed:', response.status, errorData);
        alert('Error updating message: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Error updating message: ' + String(error));
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
        setImageUrl(data.data.url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No messages yet</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.user.email === userEmail ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg group relative ${
                  message.user.email === userEmail
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-black'
                }`}
              >
                {message.user.email !== userEmail && (
                  <div className="text-xs font-bold mb-1">
                    {message.user.name || message.user.email}
                  </div>
                )}

                {editingId === message.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-2 py-1 rounded text-black"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleEditMessage(message.id, editContent)
                        }
                        className="bg-green-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                        className="bg-gray-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.content && <p className="text-sm">{message.content}</p>}
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Message"
                        className="max-w-xs rounded mt-2"
                      />
                    )}
                  </>
                )}

                <div className="text-xs mt-1 opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>

                {message.user.email === userEmail && (
                  <div className="flex gap-1 mt-2">
                    {editingId !== message.id && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingId(message.id);
                            setEditContent(message.content || '');
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteMessage(message.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Send message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={sending}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={sending}
            />
            <span className="text-blue-500">📎</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={sending || (!content.trim() && !imageUrl)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {imageUrl && (
        <div className="px-4 pb-4">
          <div className="relative max-w-xs">
            <img src={imageUrl} alt="Preview" className="rounded" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
