const sectionTitles: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  transactions: "Transactions",
  suppliers: "Suppliers",
  reports: "Reports",
  "activity-logs": "Activity Logs",
};

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const title = sectionTitles[section] ?? "Section";

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-2 text-zinc-600">Placeholder page for {title} module.</p>
    </section>
  );
}
