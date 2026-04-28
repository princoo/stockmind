const rwfFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export function formatRwf(value: number) {
  return rwfFormatter.format(value);
}
