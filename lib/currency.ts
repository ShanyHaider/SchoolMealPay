const CURRENCY_PREFIX = "Rs.";

// export function formatPKR(amount: number): string {
//   if (amount === 0) return "Free";
//   if (amount >= 100_000)
//     return `${CURRENCY_PREFIX} ${(amount / 100_000).toLocaleString("en-PK", { maximumFractionDigits: 1 })} lac`;
//   if (amount >= 1_000)
//     return `${CURRENCY_PREFIX} ${(amount / 1_000).toLocaleString("en-PK", { maximumFractionDigits: 1 })}k`;
//   return `${CURRENCY_PREFIX} ${Math.round(amount).toLocaleString("en-PK")}`;
// }

export function formatPKR(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
