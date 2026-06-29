import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  irregularVerbsSeedData,
  type SeedAuxiliaryVerb,
} from "@/lib/data/irregularVerbsSeed";

export type AuxiliaryVerb = SeedAuxiliaryVerb;

export type IrregularVerb = {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: AuxiliaryVerb;
};

export type VerbWithTranslations = IrregularVerb & {
  translations: {
    en?: string;
    ru?: string;
  };
};

const SCHEMA_VERSION = 2;

// noinspection SqlResolve,SqlDialectInspection
const CREATE_VERBS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS irregular_verbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    infinitive TEXT NOT NULL UNIQUE,
    past_singular TEXT NOT NULL,
    past_plural TEXT NOT NULL,
    past_participle TEXT NOT NULL,
    auxiliary TEXT NOT NULL CHECK (auxiliary IN ('hebben', 'zijn', 'hebben/zijn')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

// noinspection SqlResolve,SqlDialectInspection
const CREATE_LANGUAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );
`;

// noinspection SqlResolve,SqlDialectInspection
const CREATE_TRANSLATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS verb_translations (
    verb_id INTEGER REFERENCES irregular_verbs(id) ON DELETE CASCADE,
    language_code VARCHAR(2) REFERENCES languages(code) ON DELETE CASCADE,
    translation VARCHAR(255) NOT NULL,
    PRIMARY KEY (verb_id, language_code)
  );
`;

const UPSERT_VERB_SQL = `
  INSERT INTO irregular_verbs (
    infinitive,
    past_singular,
    past_plural,
    past_participle,
    auxiliary,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(infinitive) DO UPDATE SET
    past_singular = excluded.past_singular,
    past_plural = excluded.past_plural,
    past_participle = excluded.past_participle,
    auxiliary = excluded.auxiliary,
    updated_at = CURRENT_TIMESTAMP;
`;

function getDatabaseFilePath(): string {
  return process.env.IRREGULAR_VERBS_DB_PATH ?? path.join(process.cwd(), "data", "irregular-verbs.sqlite");
}

function ensureDatabaseDirectory(dbPath: string): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export function openIrregularVerbsDb(): Database.Database {
  const dbPath = getDatabaseFilePath();
  ensureDatabaseDirectory(dbPath);

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  return db;
}

function ensureSchema(db: Database.Database): void {
  const currentSchemaVersion = db.pragma("user_version", { simple: true }) as number;

  if (currentSchemaVersion < SCHEMA_VERSION) {
    db.exec(`
      DROP TABLE IF EXISTS verb_translations;
      DROP TABLE IF EXISTS languages;
      DROP TABLE IF EXISTS irregular_verbs;
    `);
  }

  db.exec(CREATE_VERBS_TABLE_SQL);
  db.exec(CREATE_LANGUAGES_TABLE_SQL);
  db.exec(CREATE_TRANSLATIONS_TABLE_SQL);

  if (currentSchemaVersion < SCHEMA_VERSION) {
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  }
}

export function initializeAndSeedIrregularVerbsDb(db: Database.Database = openIrregularVerbsDb()): {
  dbPath: string;
  totalRows: number;
} {
  ensureSchema(db);

  const upsertStatement = db.prepare(UPSERT_VERB_SQL);
  const upsertMany = db.transaction((verbs: IrregularVerb[]) => {
    for (const verb of verbs) {
      upsertStatement.run(
        verb.infinitive,
        verb.pastSingular,
        verb.pastPlural,
        verb.pastParticiple,
        verb.auxiliary
      );
    }
  });

  upsertMany(
    irregularVerbsSeedData.map(({ infinitive, pastSingular, pastPlural, pastParticiple, auxiliary }) => ({
      infinitive,
      pastSingular,
      pastPlural,
      pastParticiple,
      auxiliary,
    }))
  );

  // Seed languages
  // noinspection SqlResolve,SqlDialectInspection
  const insertLanguage = db.prepare(
    "INSERT OR IGNORE INTO languages (code, name) VALUES (?, ?)"
  );
  insertLanguage.run("en", "English");
  insertLanguage.run("ru", "Russian");

  // Seed translations
  // noinspection SqlResolve,SqlDialectInspection
  const insertTranslation = db.prepare(
    `INSERT INTO verb_translations (verb_id, language_code, translation)
     VALUES (?, ?, ?)
     ON CONFLICT(verb_id, language_code) DO UPDATE SET
       translation = excluded.translation`
  );
  const transaction = db.transaction((verbIds: Map<string, number>) => {
    for (const verb of irregularVerbsSeedData) {
      const verbId = verbIds.get(verb.infinitive);

      if (!verbId) {
        continue;
      }

      insertTranslation.run(verbId, "en", verb.translations.en);
      insertTranslation.run(verbId, "ru", verb.translations.ru);
    }
  });

  const verbIdRows = db
    .prepare("SELECT id, infinitive FROM irregular_verbs")
    .all() as Array<{ id: number; infinitive: string }>;
  const verbIds = new Map(verbIdRows.map((row) => [row.infinitive, row.id]));
  transaction(verbIds);

  const result = db.prepare("SELECT COUNT(*) AS totalRows FROM irregular_verbs").get() as { totalRows: number };

  return {
    dbPath: getDatabaseFilePath(),
    totalRows: result.totalRows,
  };
}


/**
 * Opens the database, ensures it is seeded, returns every verb with its
 * translations, and closes the connection. Shared by the server pages that
 * just need the full list.
 */
export function getAllVerbs(): VerbWithTranslations[] {
  const db = openIrregularVerbsDb();

  try {
    initializeAndSeedIrregularVerbsDb(db);
    return listIrregularVerbsWithTranslations(db);
  } finally {
    db.close();
  }
}

export function listIrregularVerbsWithTranslations(
  db: Database.Database = openIrregularVerbsDb()
): VerbWithTranslations[] {
  const verbs = db
    .prepare(
      `SELECT
        id,
        infinitive,
        past_singular AS pastSingular,
        past_plural AS pastPlural,
        past_participle AS pastParticiple,
        auxiliary
      FROM irregular_verbs
      ORDER BY infinitive`
    )
    .all() as Array<{ id: number } & IrregularVerb>;

  const translations = db
    .prepare(
      `SELECT
        verb_id,
        language_code,
        translation
      FROM verb_translations`
    )
    .all() as Array<{ verb_id: number; language_code: string; translation: string }>;

  const translationMap = new Map<
    number,
    Record<string, string>
  >();
  for (const trans of translations) {
    if (!translationMap.has(trans.verb_id)) {
      translationMap.set(trans.verb_id, {});
    }
    translationMap.get(trans.verb_id)![trans.language_code] = trans.translation;
  }

  return verbs.map((verb) => ({
    infinitive: verb.infinitive,
    pastSingular: verb.pastSingular,
    pastPlural: verb.pastPlural,
    pastParticiple: verb.pastParticiple,
    auxiliary: verb.auxiliary,
    translations: translationMap.get(verb.id) || {},
  }));
}


