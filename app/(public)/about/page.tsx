export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
      <section className="ui-glass p-8 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">About stockmind</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 sm:text-lg">
          stockmind is designed to help teams simplify day-to-day inventory operations. It combines
          product management, stock movement tracking, reports, and notifications in a focused platform
          that stays easy to use as your operations grow.
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          The goal is straightforward: reduce inventory blind spots, improve decision quality, and give
          operational teams a reliable system they can trust every day.
        </p>
      </section>
    </div>
  );
}
