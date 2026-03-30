const CATEGORY_RULES: Record<string, string[]> = {
  Food: ["swiggy", "zomato", "dominos", "mcdonald", "starbucks"],
  Travel: ["uber", "ola", "rapido", "irctc"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio"],
  Bills: ["electricity", "recharge", "broadband", "airtel", "jio"],
  Entertainment: ["netflix", "prime", "bookmyshow", "spotify"],
};

export function categorizeMerchant(merchant: string) {
  const value = merchant.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    if (keywords.some((keyword) => value.includes(keyword))) {
      return category;
    }
  }

  return "Others";
}
