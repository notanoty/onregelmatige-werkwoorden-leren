'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type LanguageCode = 'en' | 'ru';

interface Verb {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: 'hebben' | 'zijn' | 'hebben/zijn';
  translations?: {
    en?: string;
    ru?: string;
  };
}

interface WordsTableProps {
  verbs: Verb[];
}

const languageLabels: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
};

export function WordsTable({ verbs }: WordsTableProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    verbs.forEach((verb) => {
      letters.add(verb.infinitive.charAt(0).toLowerCase());
    });
    return Array.from(letters).sort();
  }, [verbs]);

  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(
    () => new Set(availableLetters)
  );

  const displayLanguageLabel = languageLabels[selectedLanguage];

  const visibleVerbs = useMemo(() => {
    return verbs.filter((verb) =>
      selectedLetters.has(verb.infinitive.charAt(0).toLowerCase())
    );
  }, [verbs, selectedLetters]);

  const toggleLetter = (letter: string) => {
    setSelectedLetters((previous) => {
      const next = new Set(previous);
      if (next.has(letter)) {
        next.delete(letter);
      } else {
        next.add(letter);
      }
      return next;
    });
  };

  const toggleAllLetters = () => {
    setSelectedLetters((previous) =>
      previous.size === availableLetters.length ? new Set() : new Set(availableLetters)
    );
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen font-sans py-8" style={{ backgroundColor: '#FFDAB9' }}>
      <main className="flex flex-col gap-8 px-8 max-w-7xl w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            All Irregular Words
          </h1>
          <Link
            href="/"
            className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: '#f8f8f8',
              color: '#1a1a1a',
              border: '2px solid #1a1a1a',
            }}
          >
            ← Home
          </Link>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-lg font-semibold" htmlFor="translation-language" style={{ color: '#1a1a1a' }}>
            Translation language
          </label>
          <select
            id="translation-language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: '#f8f8f8',
              color: '#1a1a1a',
              border: '2px solid #1a1a1a',
            }}
          >
            <option value="en">English</option>
            <option value="ru">Russian</option>
          </select>
          <div style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
            Words shown: {visibleVerbs.length} / {verbs.length} | Translation: {displayLanguageLabel}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold" style={{ color: '#1a1a1a' }}>
            Filter by Starting Letter
          </h2>
          <button
            type="button"
            onClick={toggleAllLetters}
            className="px-4 py-2 font-semibold rounded-lg transition-all duration-200 hover:scale-105 w-fit"
            style={{
              backgroundColor: selectedLetters.size === availableLetters.length ? '#1a1a1a' : '#f8f8f8',
              color: selectedLetters.size === availableLetters.length ? '#f8f8f8' : '#1a1a1a',
              border: '2px solid #1a1a1a',
            }}
          >
            {selectedLetters.size === availableLetters.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => toggleLetter(letter)}
                className="px-3 py-2 font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: selectedLetters.has(letter) ? '#1a1a1a' : '#f8f8f8',
                  color: selectedLetters.has(letter) ? '#f8f8f8' : '#1a1a1a',
                  border: '2px solid #1a1a1a',
                }}
              >
                {letter.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {visibleVerbs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border-2" style={{ borderColor: '#1a1a1a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#1a1a1a' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>
                    Infinitive
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>
                    Translation
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>
                    Past Singular
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>
                    Past Plural
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>
                    Past Participle
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleVerbs.map((verb, index) => (
                  <tr
                    key={verb.infinitive}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f8f8f8' : '#fff',
                    }}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1a1a1a' }}>
                      {verb.infinitive}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{verb.translations?.[selectedLanguage] || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>
                      {verb.pastSingular}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>
                      {verb.pastPlural}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>
                      {verb.pastParticiple} <span className="font-semibold">({verb.auxiliary})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#1a1a1a' }} className="text-center py-8">
            <p className="text-lg">No words found.</p>
          </div>
        )}
      </main>
    </div>
  );
}

