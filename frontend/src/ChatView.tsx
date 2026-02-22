import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getThreads, createThread } from './api';
import MessageItem from './MessageItem';
import ThreadPanel from './ThreadPanel';

type Message = { _id: string; role: string; content: string; index: number };

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [threadsByMessage, setThreadsByMessage] = useState<Record<string, { _id: string; title: string }[]>>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const effectiveChatId = chatId === 'new' ? null : chatId;

  useEffect(() => {
    setSelectedThreadId(null);
  }, [effectiveChatId]);

  useEffect(() => {
    if (!effectiveChatId) {
      setMessages([]);
      setThreadsByMessage({});
      return;
    }
    getMessages(effectiveChatId).then((list: Message[]) => {
      setMessages(list);
      const msgIds = list.map((m) => m._id);
      Promise.all(
        msgIds.map((messageId) =>
          getThreads(effectiveChatId, messageId).then((threads: { _id: string; title: string }[]) => ({
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
      });
    }).catch(console.error);
  }, [effectiveChatId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!effectiveChatId) {
      const { createChat } = await import('./api');
      const chat = await createChat();
      setInput('');
      setSending(true);
      try {
        await sendMessage(chat._id, text);
        navigate(`/chats/${chat._id}`, { replace: true });
      } finally {
        setSending(false);
      }
      return;
    }
    setInput('');
    setSending(true);
    try {
      const { userMessage, assistantMessage } = await sendMessage(effectiveChatId, text);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (messageId: string) => {
    if (!effectiveChatId) return;
    const childChatId = await createThread(effectiveChatId, messageId);
    setThreadsByMessage((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), { _id: childChatId, title: 'Thread' }],
    }));
    setSelectedThreadId(childChatId);
  };

  const handleOpenThreadInPanel = (threadChatId: string) => {
    setSelectedThreadId(threadChatId);
  };

  const handleOpenThreadAsChat = () => {
    if (selectedThreadId) {
      navigate(`/chats/${selectedThreadId}`);
      setSelectedThreadId(null);
    }
  };

  if (!effectiveChatId && messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        <div style={{ flex: 1 }} />
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message…"
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7',
              resize: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', minWidth: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              threads={threadsByMessage[msg._id] || []}
              onCreateThread={() => handleCreateThread(msg._id)}
              onOpenThread={handleOpenThreadInPanel}
            />
          ))}
        </div>
        <div style={{ maxWidth: '800px', margin: '1rem auto 0', width: '100%' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message…"
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#e4e4e7',
              resize: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
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
      {selectedThreadId && (
        <ThreadPanel
          threadChatId={selectedThreadId}
          onClose={() => setSelectedThreadId(null)}
          onOpenFullChat={handleOpenThreadAsChat}
          onSelectThread={setSelectedThreadId}
        />
      )}
    </div>
  );
}
