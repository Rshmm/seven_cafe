export const CATEGORIES = [
  { id: "all", label: "همه" },
  { id: "hot", label: "نوشیدنی گرم" },
  { id: "cold", label: "نوشیدنی سرد" },
  { id: "dessert", label: "دسر" },
];

export const PRODUCTS = [
  { id: "espresso", name: "اسپرسو", emoji: "☕", category: "hot", description: "قهوه‌ای غلیظ و خوش‌عطر", price: 65000 },
  { id: "americano", name: "آمریکانو", emoji: "☕", category: "hot", description: "اسپرسو با آب داغ و طعمی متعادل", price: 75000 },
  { id: "latte", name: "لاته", emoji: "☕", category: "hot", description: "اسپرسو با شیر بخار داده‌شده", price: 95000 },
  { id: "iced-latte", name: "آیس‌لاته", emoji: "🧊", category: "cold", description: "لاته خنک با یخ فراوان", price: 105000 },
  { id: "lemonade", name: "لیموناد", emoji: "🍋", category: "cold", description: "ترکیب تازه و ترش لیمو", price: 85000 },
  { id: "iced-tea", name: "آیس‌تی", emoji: "🍹", category: "cold", description: "چای خنک با طعم میوه‌ای", price: 80000 },
  { id: "cheesecake", name: "چیزکیک", emoji: "🍰", category: "dessert", description: "بافت خامه‌ای روی بیسکویت ترد", price: 120000 },
  { id: "brownie", name: "براونی", emoji: "🍫", category: "dessert", description: "کیک شکلاتی نرم و غلیظ", price: 90000 },
  { id: "cookie", name: "کوکی", emoji: "🍪", category: "dessert", description: "کوکی تازه با تکه‌های شکلات", price: 55000 },
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
