import { MeiliSearch } from "meilisearch";

const host = process.env.MEILISEARCH_HOST ?? "http://127.0.0.1:7700";
const apiKey = process.env.MEILISEARCH_API_KEY ?? "masterKey";

export const meili = new MeiliSearch({ host, apiKey });

export async function searchListings(query: string) {
  const index = meili.index("listings");
  return index.search(query, { limit: 20 });
}
