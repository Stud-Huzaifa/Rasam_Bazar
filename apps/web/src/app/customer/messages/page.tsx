'use client';

import { useEffect, useState } from 'react';
import { getJson, patchJson, postJson } from '../../lib/api';

export default function CustomerMessagesPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    try {
      const [notificationData, threadData, bookingData] = await Promise.all([
        getJson('/notifications'),
        getJson('/message-threads'),
        getJson('/customer/bookings'),
      ]);
      const threadList = Array.isArray(threadData) ? threadData : [];
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
      setThreads(threadList);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setSelectedThreadId((current) => current || threadList[0]?.id || '');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(threadId: string) {
    if (!threadId) {
      setMessages([]);
      return;
    }
    const data = await getJson(`/message-threads/${threadId}/messages`);
    setMessages(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    void loadMessages(selectedThreadId);
  }, [selectedThreadId]);

  async function createThread(bookingId: string) {
    try {
      setError('');
      setSuccess('');
      const thread = await postJson(
        `/bookings/${bookingId}/message-thread`,
        {},
      );
      await loadData();
      setSelectedThreadId(thread.id);
      setSuccess('Conversation opened.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open thread');
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedThreadId || !body.trim()) return;
    try {
      setError('');
      setSuccess('');
      await postJson(`/message-threads/${selectedThreadId}/messages`, { body });
      setBody('');
      await loadMessages(selectedThreadId);
      await loadData();
      setSuccess('Message sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    }
  }

  async function markRead(notificationId: string) {
    try {
      await patchJson(`/notifications/${notificationId}/read`, {});
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update notification',
      );
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 px-6 py-16 text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
            Inbox
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Messages and alerts</h1>
          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Loading inbox...</p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-6 rb-alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" aria-live="polite" className="mt-6 rb-success">
              {success}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">Booking threads</h2>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                type="button"
                className={`block w-full rounded-xl border p-4 text-left ${selectedThreadId === thread.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-slate-900/70 hover:bg-white/10'}`}
              >
                <span className="font-medium">{thread.title}</span>
                <span className="mt-1 block text-sm text-slate-400">
                  {thread.vendor?.businessName || 'Vendor conversation'}
                </span>
              </button>
            ))}
            {threads.length === 0 ? (
              <p className="text-sm text-slate-400">
                Open a thread from one of your bookings.
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">Start from booking</h2>
            {bookings.slice(0, 5).map((booking) => (
              <button
                key={booking.id}
                onClick={() => void createThread(booking.id)}
                type="button"
                className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-300 hover:bg-white/10"
              >
                {booking.title}
              </button>
            ))}
            {!loading && bookings.length === 0 ? (
              <p className="rb-empty text-sm">
                No bookings available for new conversations.
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Conversation</h2>
            <div className="mt-5 max-h-[460px] space-y-3 overflow-y-auto pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <p className="text-sm text-amber-300">
                    {message.sender?.fullName || message.sender?.email}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{message.body}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {selectedThreadId && messages.length === 0 ? (
                <p className="text-sm text-slate-400">No messages yet.</p>
              ) : null}
              {!selectedThreadId ? (
                <p className="text-sm text-slate-400">
                  Select a booking thread to view messages.
                </p>
              ) : null}
            </div>
            <form onSubmit={sendMessage} className="mt-5 flex gap-3">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a message"
                aria-label="Message body"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
              />
              <button
                disabled={!selectedThreadId || !body.trim()}
                className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-70"
              >
                Send
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <button
                type="button"
                onClick={() =>
                  void postJson('/notifications/mark-all-read', {}).then(
                    loadData,
                  )
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
              >
                Mark all read
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => void markRead(notification.id)}
                  type="button"
                  className={`block w-full rounded-xl border p-4 text-left ${notification.readAt ? 'border-white/10 bg-white/5' : 'border-amber-400/40 bg-amber-400/10'}`}
                >
                  <span className="font-medium">{notification.title}</span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {notification.body}
                  </span>
                </button>
              ))}
              {!loading && notifications.length === 0 ? (
                <p className="rb-empty text-sm">No notifications yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
