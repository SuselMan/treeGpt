const API = '/api';

function getHeaders(): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  return h;
}

export async function getMe() {
  const r = await fetch(`${API}/me`, { credentials: 'include', headers: getHeaders() });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error('Failed to fetch user');
  return r.json();
}

export async function getChats() {
  const r = await fetch(`${API}/chats`, { credentials: 'include', headers: getHeaders() });
  if (!r.ok) throw new Error('Failed to fetch chats');
  return r.json();
}

export async function createChat() {
  const r = await fetch(`${API}/chats`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!r.ok) throw new Error('Failed to create chat');
  return r.json();
}

export async function getChat(chatId: string) {
  const r = await fetch(`${API}/chats/${chatId}`, { credentials: 'include', headers: getHeaders() });
  if (!r.ok) throw new Error('Failed to fetch chat');
  return r.json();
}

export async function getMessages(chatId: string) {
  const r = await fetch(`${API}/chats/${chatId}/messages`, { credentials: 'include', headers: getHeaders() });
  if (!r.ok) throw new Error('Failed to fetch messages');
  return r.json();
}

export async function sendMessage(chatId: string, content: string) {
  const r = await fetch(`${API}/chats/${chatId}/send`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!r.ok) throw new Error('Failed to send message');
  return r.json();
}

export async function getThreads(chatId: string, messageId: string) {
  const r = await fetch(`${API}/chats/${chatId}/messages/${messageId}/threads`, { credentials: 'include', headers: getHeaders() });
  if (!r.ok) throw new Error('Failed to fetch threads');
  return r.json();
}

export async function createThread(chatId: string, messageId: string) {
  const r = await fetch(`${API}/chats/${chatId}/messages/${messageId}/threads`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
  });
  if (!r.ok) throw new Error('Failed to create thread');
  const data = await r.json();
  return data.childChatId as string;
}

export function googleLoginUrl() {
  return `${API}/auth/google/start`;
}
