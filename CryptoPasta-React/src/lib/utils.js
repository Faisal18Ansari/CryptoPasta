export { cn } from "cn"

export const formatIndianNumber = (value, maximumFractionDigits = 2) => {
	if (value == null || value === "") return "—";

	const number = Number(value);
	if (!Number.isFinite(number)) return "—";

	return number.toLocaleString("en-IN", { maximumFractionDigits });
};
