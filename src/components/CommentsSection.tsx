import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.PUBLIC_COMMENTS_API || 'https://tadawi-comments-api.miladsoft.workers.dev';

interface Comment {
  id: number;
  postSlug: string;
  postType: string;
  author: string;
  body: string;
  createdAt: string;
}

interface Props {
  postSlug: string;
  postType: 'post' | 'product';
}

const translations: Record<string, Record<string, string>> = {
  en: {
    comments: 'Comments',
    name: 'Your Name',
    comment: 'Your Comment',
    submit: 'Submit Comment',
    submitting: 'Submitting...',
    noComments: 'No comments yet. Be the first to comment!',
    commentAdded: 'Comment added successfully!',
    error: 'Failed to submit comment. Please try again.',
  },
  ar: {
    comments: 'التعليقات',
    name: 'اسمك',
    comment: 'تعليقك',
    submit: 'إرسال التعليق',
    submitting: 'جاري الإرسال...',
    noComments: 'لا توجد تعليقات بعد. كن أول من يعلق!',
    commentAdded: 'تم إضافة التعليق بنجاح!',
    error: 'فشل إرسال التعليق. حاول مرة أخرى.',
  },
};

function getT(lang: string) {
  return translations[lang] || translations.en;
}

export default function CommentsSection({ postSlug, postType }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lang, setLang] = useState('en');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') || 'en';
    setLang(storedLang);

    async function fetchComments() {
      try {
        const resp = await fetch(`${API_URL}/comments/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postSlug, postType }),
        });
        const result = await resp.json();
        if (result.data) setComments(result.data);
      } catch {
        // silently fail
      } finally {
        setFetching(false);
      }
    }
    fetchComments();
  }, [postSlug, postType]);

  const t = getT(lang);
  const isRtl = lang === 'ar' || lang === 'fa';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/comments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug,
          postType,
          author: author.trim(),
          body: body.trim(),
        }),
      });
      const result = await resp.json();
      if (result.data) {
        setComments((prev) => [...prev, result.data]);
        setAuthor('');
        setBody('');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function formatDate(d: Date | string) {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="card-base rounded-[var(--radius-large)] overflow-hidden relative mb-4 p-6">
      <h2 className="text-xl font-bold text-black/90 dark:text-white/90 mb-4">
        {t.comments} ({comments.length})
      </h2>

      {/* Comment list */}
      <div className="space-y-4 mb-6">
        {fetching ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-black/50 dark:text-white/50 text-sm">{t.noComments}</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-black/5 dark:bg-white/5 rounded-xl p-4 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-black/80 dark:text-white/80">{c.author}</span>
                <span className="text-xs text-black/40 dark:text-white/40">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-black/70 dark:text-white/70 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Comment form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={t.name}
          required
          maxLength={100}
          className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10
                     text-black/90 dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/30
                     focus:outline-none focus:border-[var(--primary)] transition text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.comment}
          required
          maxLength={2000}
          rows={3}
          className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10
                     text-black/90 dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/30
                     focus:outline-none focus:border-[var(--primary)] transition text-sm resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm
                     hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  );
}
