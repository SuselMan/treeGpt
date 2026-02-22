import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Login from './Login';
import ChatView from './ChatView';

export default function App() {
  const [user, setUser] = useState<{ _id: string; name: string } | null | undefined>(undefined);

  useEffect(() => {
    getMe().then(setUser);
    async function getMe() {
      const { getMe: apiGetMe } = await import('./api');
      return apiGetMe();
    }
  }, []);

  if (user === undefined) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Layout user={user} />}>
        <Route index element={<Navigate to="/chats/new" replace />} />
        <Route path="chats/new" element={<ChatView />} />
        <Route path="chats/:chatId" element={<ChatView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
