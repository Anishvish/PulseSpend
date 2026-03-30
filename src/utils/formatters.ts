import dayjs from "dayjs";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDisplayDate(value: string) {
  return dayjs(value).format("DD MMM YYYY");
}

export function groupDateLabel(value: string) {
  const date = dayjs(value);
  if (date.isSame(dayjs(), "day")) {
    return "Today";
  }
  if (date.isSame(dayjs().subtract(1, "day"), "day")) {
    return "Yesterday";
  }
  return date.format("DD MMM YYYY");
}
