type AccessDeniedProps = Readonly<{
  title?: string;
  description?: string;
}>;

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to access this section.",
}: AccessDeniedProps) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-amber-900">{title}</h1>
      <p className="mt-2 text-sm text-amber-800">{description}</p>
    </section>
  );
}
