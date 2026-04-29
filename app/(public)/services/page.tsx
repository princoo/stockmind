import { Bell, Boxes, ChartColumnIncreasing, ClipboardList, PackageSearch } from "lucide-react";

const services = [
  {
    title: "Product management",
    description: "Create and maintain products, categories, pricing, and supplier links in one workflow.",
    icon: PackageSearch,
  },
  {
    title: "Inventory tracking",
    description: "Track current stock, monitor low-stock thresholds, and avoid costly surprises.",
    icon: Boxes,
  },
  {
    title: "Transactions",
    description: "Record stock-in and stock-out movements with clear history and accountability.",
    icon: ClipboardList,
  },
  {
    title: "Reports",
    description: "Analyze inventory flow and inventory health with structured data and insights.",
    icon: ChartColumnIncreasing,
  },
  {
    title: "Notifications",
    description: "Receive timely low-stock updates so replenishment decisions happen at the right time.",
    icon: Bell,
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
      <section className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">Services & Features</h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 sm:text-lg">
          stockmind provides the essential capabilities teams need to manage stock operations with confidence.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.title} className="ui-panel rounded-2xl p-6 transition-all hover:-translate-y-0.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={20} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-zinc-900">{service.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{service.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
