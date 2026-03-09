import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Project</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          A finance app growing from a clean foundation.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          The app now includes authenticated backend resources for accounts,
          categories, budgets, transactions, dashboard summaries, and monthly
          reports. The frontend is beginning to consume those endpoints with a
          focused personal-finance interface instead of generic starter content.
        </p>
      </section>
    </main>
  )
}
