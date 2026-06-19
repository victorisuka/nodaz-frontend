import { Link } from 'react-router-dom'

import { StatusMessage } from '../ui/StatusMessage.jsx'

const ratingOptions = [1, 2, 3, 4, 5]

function formatAverage(summary) {
  if (!summary?.reviewCount) {
    return 'Aucun avis pour le moment'
  }

  return `${summary.averageRating}/5 sur ${summary.reviewCount} avis`
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function ReviewSection({
  eyebrow,
  title,
  summary,
  reviews,
  formState,
  onChange,
  onSubmit,
  submitStatus,
  message,
  error,
  loginRequired,
  emptyMessage,
}) {
  return (
    <section className="panel space-y-5 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94a3]">{eyebrow}</p>
          <h2 className="headline mt-2 text-3xl text-[#161d29]">{title}</h2>
        </div>
        <div className="rounded-[1.2rem] border border-[#edf1f4] bg-[#f9fbfd] px-4 py-3 text-sm font-medium text-[#475467]">
          {formatAverage(summary)}
        </div>
      </div>

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {loginRequired ? (
        <div className="rounded-[1.2rem] border border-dashed border-[#dfe5ec] bg-[#f9fbfd] px-4 py-5 text-sm text-[#627083]">
          <Link to="/login" className="font-semibold text-[#0b6b8d]">Connectez-vous</Link> pour publier un avis.
        </div>
      ) : (
        <form className="space-y-4 rounded-[1.4rem] border border-[#edf1f4] bg-[#f9fbfd] p-4" onSubmit={onSubmit}>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Note</p>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`min-w-12 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    Number(formState.rating) === rating
                      ? 'bg-[#0e9bce] text-white'
                      : 'border border-[#dfe5ec] bg-white text-[#475467]'
                  }`}
                  onClick={() => onChange({ target: { name: 'rating', value: String(rating) } })}
                >
                  {rating}/5
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`${eyebrow}-title`} className="mb-2 block text-sm font-medium text-slate-700">
              Titre
            </label>
            <input id={`${eyebrow}-title`} name="title" className="field" value={formState.title} onChange={onChange} required />
          </div>

          <div>
            <label htmlFor={`${eyebrow}-comment`} className="mb-2 block text-sm font-medium text-slate-700">
              Avis
            </label>
            <textarea id={`${eyebrow}-comment`} name="comment" rows="4" className="field" value={formState.comment} onChange={onChange} required />
          </div>

          <button type="submit" className="button-primary" disabled={submitStatus === 'loading'}>
            {submitStatus === 'loading' ? 'Enregistrement...' : 'Publier l avis'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {reviews.length ? (
          reviews.map((review) => (
            <article key={review.id} className="rounded-[1.2rem] border border-[#edf1f4] bg-white p-4 shadow-[0_16px_40px_-32px_rgba(50,62,74,0.25)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#161d29]">{review.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a94a3]">
                    {review.rating}/5 par {review.author?.name ?? 'Utilisateur'}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8a94a3]">{formatDate(review.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#627083]">{review.comment}</p>
            </article>
          ))
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-[#dfe5ec] bg-[#f9fbfd] px-4 py-6 text-sm text-[#627083]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  )
}