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

export type StreamDone = {
  userMessage: { _id: string; role: string; content: string; index: number };
  assistantMessage: { _id: string; role: string; content: string; index: number };
};

export async function sendMessageStream(
  chatId: string,
  content: string,
  callbacks: { onChunk: (text: string) => void; onDone: (data: StreamDone) => void; onError: (err: string) => void }
): Promise<void> {
  const r = await fetch(`${API}/chats/${chatId}/send-stream`, {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!r.ok) {
    callbacks.onError('Request failed');
    return;
  }
  const reader = r.body?.getReader();
  if (!reader) {
    callbacks.onError('No response body');
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line) as { type: string; content?: string; error?: string; userMessage?: unknown; assistantMessage?: unknown };
          if (obj.type === 'chunk' && typeof obj.content === 'string') callbacks.onChunk(obj.content);
          else if (obj.type === 'done' && obj.userMessage && obj.assistantMessage)
            callbacks.onDone({ userMessage: obj.userMessage as StreamDone['userMessage'], assistantMessage: obj.assistantMessage as StreamDone['assistantMessage'] });
          else if (obj.type === 'error') callbacks.onError(obj.error ?? 'Unknown error');
        } catch (_) {
          // skip malformed line
        }
      }
    }
  } catch (e) {
    callbacks.onError((e as Error).message);
  }
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
