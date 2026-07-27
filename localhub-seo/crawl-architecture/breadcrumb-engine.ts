export type BreadcrumbNode = {
  label: string;
  href: string;
};

export function buildBreadcrumbs(category: string, city: string, suburb: string): BreadcrumbNode[] {
  const c = encodeURIComponent(category.toLowerCase());
  const ci = encodeURIComponent(city.toLowerCase());
  const s = encodeURIComponent(suburb.toLowerCase());

  return [
    { label: "Home", href: "/" },
    { label: category, href: `/${c}` },
    { label: city, href: `/${c}/${ci}` },
    { label: suburb, href: `/${c}/${ci}/${s}` },
  ];
}
