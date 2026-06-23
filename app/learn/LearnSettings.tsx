'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo } from 'react';

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

interface LearnSettingsProps {
  verbs: Verb[];
}

const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
];

export function LearnSettings({ verbs }: LearnSettingsProps) {
  const router = useRouter();
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(
    new Set(Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)))
  );
  const [selectedVerbs, setSelectedVerbs] = useState<Set<string>>(
    () => new Set(verbs.map((verb) => verb.infinitive))
  );
  const [checkAnswers, setCheckAnswers] = useState(false);
  const [showInfinitive, setShowInfinitive] = useState(false);
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState<LanguageCode>('en');

  // Get unique first letters from verbs
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    verbs.forEach((verb) => {
      letters.add(verb.infinitive.charAt(0).toLowerCase());
    });
    return Array.from(letters).sort();
  }, [verbs]);

  // Filter verbs based on selected letters
  const filteredVerbs = useMemo(() => {
    return verbs
      .filter((verb) => selectedLetters.has(verb.infinitive.charAt(0).toLowerCase()))
      .sort((a, b) => a.infinitive.localeCompare(b.infinitive));
  }, [verbs, selectedLetters]);

  const selectedFilteredVerbs = useMemo(() => {
    return filteredVerbs.filter((verb) => selectedVerbs.has(verb.infinitive));
  }, [filteredVerbs, selectedVerbs]);

  const allVisibleVerbsSelected =
    filteredVerbs.length > 0 &&
    filteredVerbs.every((verb) => selectedVerbs.has(verb.infinitive));

  const toggleLetter = (letter: string) => {
    const newLetters = new Set(selectedLetters);
    if (newLetters.has(letter)) {
      newLetters.delete(letter);
    } else {
      newLetters.add(letter);
    }
    setSelectedLetters(newLetters);
  };

  const toggleAllLetters = () => {
    if (selectedLetters.size === availableLetters.length) {
      setSelectedLetters(new Set());
    } else {
      setSelectedLetters(new Set(availableLetters));
    }
  };

  const toggleVerb = (infinitive: string) => {
    setSelectedVerbs((previous) => {
      const next = new Set(previous);
      if (next.has(infinitive)) {
        next.delete(infinitive);
      } else {
        next.add(infinitive);
      }
      return next;
    });
  };

  const toggleAllVisibleVerbs = () => {
    setSelectedVerbs((previous) => {
      const next = new Set(previous);
      if (allVisibleVerbsSelected) {
        filteredVerbs.forEach((verb) => next.delete(verb.infinitive));
      } else {
        filteredVerbs.forEach((verb) => next.add(verb.infinitive));
      }
      return next;
    });
  };

  const handleStartTest = () => {
    const params = new URLSearchParams({
      letters: Array.from(selectedLetters).sort().join(','),
      words: selectedFilteredVerbs.map((verb) => verb.infinitive).join(','),
      checkAnswers: checkAnswers ? '1' : '0',
      showInfinitive: showInfinitive ? '1' : '0',
      translationLanguage: selectedTranslationLanguage,
    });

    router.push(`/learn/test?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen font-sans py-8" style={{ backgroundColor: '#FFDAB9' }}>
      <main className="flex flex-col gap-8 px-8 max-w-2xl w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            Settings
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

        {/* Filter by Letters */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold" style={{ color: '#1a1a1a' }}>
            Filter by Starting Letter
          </h2>
          <button
            onClick={toggleAllLetters}
            className="px-4 py-2 font-semibold rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: selectedLetters.size === availableLetters.length ? '#1a1a1a' : '#f8f8f8',
              color: selectedLetters.size === availableLetters.length ? '#f8f8f8' : '#1a1a1a',
              border: '2px solid #1a1a1a',
            }}
          >
            {selectedLetters.size === availableLetters.length ? 'Deselect All' : 'Select All'}
          </button>
          <div className="grid grid-cols-6 gap-2">
            {availableLetters.map((letter) => (
              <button
                key={letter}
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

        {/* Word Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-semibold" style={{ color: '#1a1a1a' }}>
              Words in this test
            </h2>
            <button
              onClick={toggleAllVisibleVerbs}
              disabled={filteredVerbs.length === 0}
              className="px-4 py-2 font-semibold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: allVisibleVerbsSelected ? '#1a1a1a' : '#f8f8f8',
                color: allVisibleVerbsSelected ? '#f8f8f8' : '#1a1a1a',
                border: '2px solid #1a1a1a',
              }}
            >
              {allVisibleVerbsSelected ? 'Deselect All Visible' : 'Select All Visible'}
            </button>
          </div>

          <div style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
            Selected: <span className="font-bold">{selectedFilteredVerbs.length}</span> /{' '}
            {filteredVerbs.length} visible ({verbs.length} total)
          </div>

          {filteredVerbs.length === 0 ? (
            <p style={{ color: '#1a1a1a' }} className="text-lg">
              No words match the current letter filter.
            </p>
          ) : (
            <div
              className="flex flex-col gap-2 max-h-80 overflow-y-auto rounded-lg p-4"
              style={{
                backgroundColor: '#f8f8f8',
                border: '2px solid #1a1a1a',
              }}
            >
              {filteredVerbs.map((verb) => {
                const isSelected = selectedVerbs.has(verb.infinitive);
                const translation = verb.translations?.[selectedTranslationLanguage];

                return (
                  <label
                    key={verb.infinitive}
                    className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleVerb(verb.infinitive)}
                      className="w-5 h-5 shrink-0"
                      style={{ accentColor: '#1a1a1a' }}
                    />
                    <span style={{ color: '#1a1a1a' }} className="font-semibold">
                      {verb.infinitive}
                    </span>
                    {translation ? (
                      <span style={{ color: '#555' }} className="text-sm">
                        {translation}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Check Answers Toggle */}
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkAnswers}
              onChange={(e) => setCheckAnswers(e.target.checked)}
              className="w-6 h-6"
              style={{
                accentColor: '#1a1a1a',
              }}
            />
            <span style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
              Check answers at the end
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showInfinitive}
              onChange={(e) => setShowInfinitive(e.target.checked)}
              className="w-6 h-6"
              style={{
                accentColor: '#1a1a1a',
              }}
            />
            <span style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
              Show infinitive
            </span>
          </label>
        </div>

        {/* Translation Language */}
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold" style={{ color: '#1a1a1a' }}>
            Translation language for the test
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-lg font-semibold" htmlFor="translation-language" style={{ color: '#1a1a1a' }}>
              Translation language
            </label>
            <select
              id="translation-language"
              value={selectedTranslationLanguage}
              onChange={(e) => setSelectedTranslationLanguage(e.target.value as LanguageCode)}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                backgroundColor: '#f8f8f8',
                color: '#1a1a1a',
                border: '2px solid #1a1a1a',
              }}
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartTest}
          disabled={selectedFilteredVerbs.length === 0}
          className="px-8 py-4 text-xl font-semibold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedFilteredVerbs.length > 0 ? '#f8f8f8' : '#ccc',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
          }}
        >
          Start Testing
        </button>
      </main>
    </div>
  );
}

