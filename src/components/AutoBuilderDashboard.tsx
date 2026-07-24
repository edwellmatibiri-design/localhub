import CategoryManager from "@/components/CategoryManager";
import SuburbManager from "@/components/SuburbManager";

export default function AutoBuilderDashboard() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <CategoryManager />
      <SuburbManager />
      <div className="card md:col-span-2">
        <h3 className="text-base font-semibold">Combo Generator</h3>
        <p className="text-lh-muted mt-2 text-sm">
          Generates category + suburb SEO pages with internal links and schema
          markup.
        </p>
      </div>
    </section>
  );
}
