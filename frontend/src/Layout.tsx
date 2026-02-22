import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getChats, createChat } from './api';

type User = { _id: string; name: string } | null;
type Chat = { _id: string; title: string; updatedAt: string };

export default function Layout({ user }: { user: User }) {
  const navigate = useNavigate();
  const params = useParams();
  const currentChatId = params.chatId;
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    getChats().then(setChats).catch(console.error);
  }, [user, navigate, currentChatId]);

  const handleNewChat = async () => {
    const chat = await createChat();
    setChats((prev) => [{ _id: chat._id, title: chat.title, updatedAt: chat.updatedAt }, ...prev]);
    navigate(`/chats/${chat._id}`);
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chats/${id}`);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid #27272a',
          padding: '1rem',
          background: '#18181b',
        }}
      >
        <button
          onClick={handleNewChat}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#3f3f46',
            color: '#e4e4e7',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + New chat
        </button>
        <nav style={{ marginTop: '1rem' }}>
          {chats.map((c) => (
            <button
              key={c._id}
              onClick={() => handleSelectChat(c._id)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                marginBottom: '4px',
                background: c._id === currentChatId ? '#3f3f46' : 'transparent',
                color: '#e4e4e7',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.title || 'New Chat'}
            </button>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
