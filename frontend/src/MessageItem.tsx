import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type Message = { _id: string; role: string; content: string };
type Thread = { _id: string; title: string };

export default function MessageItem({
  message,
  threads,
  onCreateThread,
  onOpenThread,
}: {
  message: Message;
  threads: Thread[];
  onCreateThread: () => void;
  onOpenThread: (id: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1rem',
        background: isUser ? '#27272a' : 'transparent',
        borderRadius: '8px',
      }}
    >
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {message.content}
        </ReactMarkdown>
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={onCreateThread}
          style={{
            padding: '0.35rem 0.6rem',
            fontSize: '0.8rem',
            background: '#3f3f46',
            color: '#a1a1aa',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Create thread
        </button>
        {threads.map((t) => (
          <button
            key={t._id}
            onClick={() => onOpenThread(t._id)}
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.8rem',
              background: '#18181b',
              color: '#818cf8',
              border: '1px solid #3f3f46',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {t.title || 'Thread'}
          </button>
        ))}
      </div>
    </div>
  );
}
