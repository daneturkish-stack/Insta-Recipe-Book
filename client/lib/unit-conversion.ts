import type { Ingredient } from "@/types/recipe";

export type MeasurementUnit = "imperial" | "metric";

const IMPERIAL_TO_METRIC: Record<string, { unit: string; factor: number }> = {
  "oz": { unit: "g", factor: 28.3495 },
  "ounce": { unit: "g", factor: 28.3495 },
  "ounces": { unit: "g", factor: 28.3495 },
  "lb": { unit: "kg", factor: 0.453592 },
  "lbs": { unit: "kg", factor: 0.453592 },
  "pound": { unit: "kg", factor: 0.453592 },
  "pounds": { unit: "kg", factor: 0.453592 },
  "cup": { unit: "ml", factor: 236.588 },
  "cups": { unit: "ml", factor: 236.588 },
  "tbsp": { unit: "ml", factor: 14.7868 },
  "tablespoon": { unit: "ml", factor: 14.7868 },
  "tablespoons": { unit: "ml", factor: 14.7868 },
  "tsp": { unit: "ml", factor: 4.92892 },
  "teaspoon": { unit: "ml", factor: 4.92892 },
  "teaspoons": { unit: "ml", factor: 4.92892 },
  "fl oz": { unit: "ml", factor: 29.5735 },
  "fluid ounce": { unit: "ml", factor: 29.5735 },
  "fluid ounces": { unit: "ml", factor: 29.5735 },
  "quart": { unit: "L", factor: 0.946353 },
  "quarts": { unit: "L", factor: 0.946353 },
  "gallon": { unit: "L", factor: 3.78541 },
  "gallons": { unit: "L", factor: 3.78541 },
  "pint": { unit: "ml", factor: 473.176 },
  "pints": { unit: "ml", factor: 473.176 },
  "inch": { unit: "cm", factor: 2.54 },
  "inches": { unit: "cm", factor: 2.54 },
  "°F": { unit: "°C", factor: 0 },
  "fahrenheit": { unit: "°C", factor: 0 },
};

const METRIC_TO_IMPERIAL: Record<string, { unit: string; factor: number }> = {
  "g": { unit: "oz", factor: 0.035274 },
  "gram": { unit: "oz", factor: 0.035274 },
  "grams": { unit: "oz", factor: 0.035274 },
  "kg": { unit: "lbs", factor: 2.20462 },
  "kilogram": { unit: "lbs", factor: 2.20462 },
  "kilograms": { unit: "lbs", factor: 2.20462 },
  "ml": { unit: "fl oz", factor: 0.033814 },
  "milliliter": { unit: "fl oz", factor: 0.033814 },
  "milliliters": { unit: "fl oz", factor: 0.033814 },
  "L": { unit: "quarts", factor: 1.05669 },
  "liter": { unit: "quarts", factor: 1.05669 },
  "liters": { unit: "quarts", factor: 1.05669 },
  "cm": { unit: "inches", factor: 0.393701 },
  "centimeter": { unit: "inches", factor: 0.393701 },
  "centimeters": { unit: "inches", factor: 0.393701 },
  "°C": { unit: "°F", factor: 0 },
  "celsius": { unit: "°F", factor: 0 },
};

function formatAmount(value: number): string {
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return (Math.round(value * 10) / 10).toString();
  if (value >= 1) return (Math.round(value * 100) / 100).toString();
  if (value >= 0.1) return (Math.round(value * 100) / 100).toString();
  return (Math.round(value * 1000) / 1000).toString();
}

function isImperialUnit(unit: string): boolean {
  return unit.toLowerCase() in IMPERIAL_TO_METRIC || 
         Object.keys(IMPERIAL_TO_METRIC).includes(unit);
}

function isMetricUnit(unit: string): boolean {
  return unit.toLowerCase() in METRIC_TO_IMPERIAL || 
         Object.keys(METRIC_TO_IMPERIAL).includes(unit);
}

export function convertIngredient(
  ingredient: Ingredient,
  targetUnit: MeasurementUnit
): Ingredient {
  const { amount, unit } = ingredient;
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || !unit) return ingredient;
  
  const unitLower = unit.toLowerCase().trim();
  
  if (targetUnit === "metric") {
    const mapping = IMPERIAL_TO_METRIC[unitLower] || IMPERIAL_TO_METRIC[unit];
    if (!mapping) return ingredient;
    
    const converted = numericAmount * mapping.factor;
    return {
      ...ingredient,
      amount: formatAmount(converted),
      unit: mapping.unit,
    };
  } else {
    const mapping = METRIC_TO_IMPERIAL[unitLower] || METRIC_TO_IMPERIAL[unit];
    if (!mapping) return ingredient;
    
    const converted = numericAmount * mapping.factor;
    return {
      ...ingredient,
      amount: formatAmount(converted),
      unit: mapping.unit,
    };
  }
}

export function convertIngredients(
  ingredients: Ingredient[],
  targetUnit: MeasurementUnit
): Ingredient[] {
  return ingredients.map((ing) => convertIngredient(ing, targetUnit));
}
