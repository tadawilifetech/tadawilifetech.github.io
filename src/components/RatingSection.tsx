import { actions } from 'astro:actions';
import { useState, useEffect } from 'react';

interface Props {
  postSlug: string;
  postType: 'post' | 'product';
}

const translations: Record<string, Record<string, string>> = {
  en: {
    rating: 'Rating',
    rateThis: 'Rate this',
    votes: 'votes',
    vote: 'vote',
    thankYou: 'Thank you for rating!',
    outOf: 'out of 5',
  },
  ar: {
    rating: 'التقييم',
    rateThis: 'قيّم هذا',
    votes: 'تقييمات',
    vote: 'تقييم',
    thankYou: 'شكراً لتقييمك!',
    outOf: 'من 5',
  },
};

function getT(lang: string) {
  return translations[lang] || translations.en;
}

export default function RatingSection({ postSlug, postType }: Props) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('lang') || 'en';
    setLang(storedLang);
    const voted = localStorage.getItem(`rating-${postType}-${postSlug}`);
    if (voted) setSubmitted(true);

    async function fetchRating() {
      try {
        const { data } = await actions.getRating({ postSlug, postType });
        if (data) {
          setAverage(data.average);
          setCount(data.count);
        }
      } catch {
        // silently fail
      }
    }
    fetchRating();
  }, [postSlug, postType]);

  const t = getT(lang);
  const isRtl = lang === 'ar' || lang === 'fa';

  async function handleRate(value: number) {
    if (submitted || loading) return;
    setLoading(true);
    try {
      const { data } = await actions.addRating({ postSlug, postType, value });
      if (data) {
        setAverage(data.average);
        setCount(data.count);
        setSubmitted(true);
        localStorage.setItem(`rating-${postType}-${postSlug}`, String(value));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  const displayAvg = average.toFixed(1);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="card-base rounded-[var(--radius-large)] overflow-hidden relative mb-4 p-6">
      <h2 className="text-xl font-bold text-black/90 dark:text-white/90 mb-4">
        {t.rating}
      </h2>

      <div className="flex flex-col items-center gap-3">
        {/* Stars */}
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = submitted ? star <= Math.round(average) : star <= hovered;
            return (
              <button
                type="button"
                key={star}
                disabled={submitted || loading}
                onClick={() => handleRate(star)}
                onMouseEnter={() => !submitted && setHovered(star)}
                onMouseLeave={() => !submitted && setHovered(0)}
                className={`text-3xl transition-all duration-150 ${
                  submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'
                } ${filled ? 'text-yellow-400' : 'text-black/15 dark:text-white/15'}`}
                aria-label={`${star} star`}
              >
                ★
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-sm text-black/60 dark:text-white/60 text-center">
          {count > 0 ? (
            <span>
              <span className="font-semibold text-black/80 dark:text-white/80">{displayAvg}</span>{' '}
              {t.outOf} · {count} {count === 1 ? t.vote : t.votes}
            </span>
          ) : (
            <span>{t.rateThis}</span>
          )}
        </div>

        {submitted && (
          <p className="text-xs text-[var(--primary)] font-semibold animate-pulse">{t.thankYou}</p>
        )}
      </div>
    </div>
  );
}
