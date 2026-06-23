import { initializeAndSeedIrregularVerbsDb, openIrregularVerbsDb } from "@/lib/db/irregularVerbsDb";

const db = openIrregularVerbsDb();

try {
  const { dbPath, totalRows } = initializeAndSeedIrregularVerbsDb(db);

  console.log(`SQLite database initialized at: ${dbPath}`);
  console.log(`Irregular verbs available: ${totalRows}`);
} finally {
  db.close();
}

