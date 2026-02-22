import { useEffect, useState } from 'react';
import { getMessages, sendMessage, getThreads, createThread } from './api';
import MessageItem from './MessageItem';

type Message = { _id: string; role: string; content: string; index: number };

export default function ThreadPanel({
  threadChatId,
  onClose,
  onOpenFullChat,
  onSelectThread,
}: {
  threadChatId: string;
  onClose: () => void;
  onOpenFullChat: () => void;
  onSelectThread: (threadChatId: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [threadsByMessage, setThreadsByMessage] = useState<Record<string, { _id: string; title: string }[]>>({});

  useEffect(() => {
    getMessages(threadChatId).then((list: Message[]) => setMessages(list)).catch(console.error);
  }, [threadChatId]);

  useEffect(() => {
    if (!threadChatId || messages.length === 0) {
      setThreadsByMessage({});
      return;
    }
    const msgIds = messages.map((m) => m._id);
    Promise.all(
      msgIds.map((messageId) =>
        getThreads(threadChatId, messageId).then((threads: { _id: string; title: string }[]) => ({
          messageId,
          threads,
        }))
      )
    ).then((results) => {
      const map: Record<string, { _id: string; title: string }[]> = {};
      results.forEach(({ messageId, threads }) => {
        map[messageId] = threads;
      });
      setThreadsByMessage(map);
    }).catch(console.error);
  }, [threadChatId, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      const { userMessage, assistantMessage } = await sendMessage(threadChatId, text);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (messageId: string) => {
    const childChatId = await createThread(threadChatId, messageId);
    setThreadsByMessage((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), { _id: childChatId, title: 'Thread' }],
    }));
    onSelectThread(childChatId);
  };

  return (
    <div
      style={{
        width: '380px',
        minWidth: '380px',
        borderLeft: '1px solid #27272a',
        background: '#18181b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e4e4e7' }}>Thread</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={onOpenFullChat}
            type="button"
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.75rem',
              background: '#3f3f46',
              color: '#a1a1aa',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Open as chat
          </button>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            style={{
              padding: '0.35rem 0.5rem',
              fontSize: '0.9rem',
              background: 'transparent',
              color: '#71717a',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {messages.map((msg) => (
          <MessageItem
            key={msg._id}
            message={msg}
            threads={threadsByMessage[msg._id] || []}
            onCreateThread={() => handleCreateThread(msg._id)}
            onOpenThread={onSelectThread}
          />
        ))}
      </div>
      <div style={{ padding: '1rem', borderTop: '1px solid #27272a' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Reply in thread…"
          rows={2}
          style={{
            width: '100%',
            padding: '0.6rem',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            color: '#e4e4e7',
            resize: 'none',
            fontSize: '0.9rem',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{
            marginTop: '0.5rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.85rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
