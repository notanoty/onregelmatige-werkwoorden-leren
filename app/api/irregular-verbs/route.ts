import { initializeAndSeedIrregularVerbsDb, listIrregularVerbsWithTranslations, openIrregularVerbsDb } from "@/lib/db/irregularVerbsDb";

export const runtime = "nodejs";

export async function GET() {
  const db = openIrregularVerbsDb();

  try {
    initializeAndSeedIrregularVerbsDb(db);
    const verbs = listIrregularVerbsWithTranslations(db);

    return Response.json({
      total: verbs.length,
      verbs,
    });
  } finally {
    db.close();
  }
}

