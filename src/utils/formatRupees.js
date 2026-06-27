export function formatRupees(rupees, { maximumFractionDigits = 0 } = {}) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(Number(rupees) || 0);
}
