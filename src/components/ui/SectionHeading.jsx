export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8a94a3]">{eyebrow}</p>
        <h2 className="headline mt-3 text-3xl text-[#161d29] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base leading-7 text-[#5f6b7b]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}