import {
  appFail,
  appOk,
  parseBody,
  requireInternalApiSecretFromRequest,
} from "@/lib/api";
import { canGeneratePage } from "@/lib/seoGuard";
import { SEO_RULES } from "@/lib/seoRules";

type Body = {
  queuePages?: boolean;
  keywordVolume?: number;
  listingsCount?: number;
};

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  const body = await parseBody<Body>(request);
  const queuePages = Boolean(body?.queuePages ?? false);
  if (queuePages) {
    const keywordVolume = Number(body?.keywordVolume ?? 0);
    const listingsCount = Number(body?.listingsCount ?? 0);
    if (!canGeneratePage({ keywordVolume, listingsCount })) {
      return appFail(
        400,
        "Generation blocked: insufficient keyword volume or listings.",
      );
    }
  }

  return appOk({
    created: ["midrand", "umhlanga", "morningside"],
    meta: {
      robots: SEO_RULES.indexing.defaultIndexState,
      queuePages,
    },
  });
}
