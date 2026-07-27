export type SeoVariant = {
  title: string;
  metaDescription: string;
  h1: string;
};

export function generateVariants(base: SeoVariant): [SeoVariant, SeoVariant] {
  const variantA: SeoVariant = {
    ...base,
    title: `${base.title} | Verified Local Providers`,
  };
  const variantB: SeoVariant = {
    ...base,
    metaDescription: `${base.metaDescription} Compare trusted providers and choose with confidence.`,
  };
  return [variantA, variantB];
}
