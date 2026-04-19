import { useState, useEffect } from 'react';

const API_URL = import.meta.env.PUBLIC_COMMENTS_API || 'https://tadawi-comments-api.miladsoft.workers.dev';

interface Comment {
  id: number;
  postSlug: string;
  postType: string;
  author: string;
  body: string;
  approved: number;
  createdAt: string;
}

type Tab = 'pending' | 'all';

export default function AdminComments() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  function headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchComments(currentTab?: Tab) {
    const t = currentTab ?? tab;
    setLoading(true);
    try {
      const endpoint = t === 'pending' ? '/admin/comments/pending' : '/admin/comments/all';
      const resp = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({}),
      });
      if (resp.status === 401) {
        setAuthenticated(false);
        setToken('');
        return;
      }
      const result = await resp.json();
      if (result.data) setComments(result.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    // Test the token
    const resp = await fetch(`${API_URL}/admin/comments/pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({}),
    });
    if (resp.status === 401) {
      alert('Invalid token');
      return;
    }
    setToken(token.trim());
    setAuthenticated(true);
  }

  useEffect(() => {
    if (authenticated) fetchComments();
  }, [authenticated, tab]);

  async function approve(id: number) {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/comments/approve`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ id }),
      });
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, approved: 1 } : c)));
      if (tab === 'pending') {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id: number) {
    if (!confirm('Delete this comment permanently?')) return;
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/admin/comments/reject`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ id }),
      });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ marginBottom: 16 }}>Comment Moderation</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin secret token"
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 14,
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 16px' }}>
      <h2 style={{ marginBottom: 16 }}>Comment Moderation</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: tab === t ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: tab === t ? '#eff6ff' : '#fff',
              fontWeight: tab === t ? 700 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t === 'pending' ? `Pending` : 'All Comments'}
          </button>
        ))}
        <button
          onClick={() => fetchComments()}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          {tab === 'pending' ? 'No pending comments.' : 'No comments found.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: c.approved ? '#f0fdf4' : '#fffbeb',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <strong>{c.author}</strong>
                  <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>
                    on {c.postType}/{c.postSlug}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(c.createdAt)}</span>
              </div>
              <p style={{ margin: '8px 0', fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.body}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!c.approved && (
                  <button
                    onClick={() => approve(c.id)}
                    disabled={actionLoading === c.id}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: actionLoading === c.id ? 0.5 : 1,
                    }}
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => reject(c.id)}
                  disabled={actionLoading === c.id}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: actionLoading === c.id ? 0.5 : 1,
                  }}
                >
                  Delete
                </button>
                {c.approved ? (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Approved</span>
                ) : (
                  <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
