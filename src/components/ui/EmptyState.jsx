export function EmptyState({ eyebrow, title, description, action }) {
  return (
    <section className="panel px-6 py-12 text-center sm:px-10">
      {eyebrow ? <p className="pill">{eyebrow}</p> : null}
      <h2 className="headline mt-4 text-3xl text-slate-950">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-2xl text-slate-600">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  )
}