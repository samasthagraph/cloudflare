export function getNormalizedLanguage(item: any): "ml" | "en" {
  return item?.language === "en" ? "en" : "ml";
}

export function isMalayalam(item: any): boolean {
  return getNormalizedLanguage(item) === "ml";
}

export function isEnglish(item: any): boolean {
  return getNormalizedLanguage(item) === "en";
}
