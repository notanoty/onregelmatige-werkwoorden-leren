import { openIrregularVerbsDb } from "@/lib/db/irregularVerbsDb";

type AuxiliaryCount = {
  auxiliary: "hebben" | "zijn";
  total: number;
};

const db = openIrregularVerbsDb();

try {
  const totalResult = db.prepare("SELECT COUNT(*) AS total FROM irregular_verbs").get() as { total: number };
  const auxiliaryBreakdown = db
    .prepare("SELECT auxiliary, COUNT(*) AS total FROM irregular_verbs GROUP BY auxiliary ORDER BY auxiliary ASC")
    .all() as AuxiliaryCount[];
  const sampleRows = db
    .prepare(
      `SELECT
        infinitive,
        past_singular,
        past_plural,
        past_participle,
        auxiliary
      FROM irregular_verbs
      ORDER BY infinitive ASC
      LIMIT 5`
    )
    .all();

  console.log(`Total verbs: ${totalResult.total}`);
  console.log("By auxiliary verb:", auxiliaryBreakdown);
  console.log("Sample rows:", sampleRows);
} finally {
  db.close();
}

