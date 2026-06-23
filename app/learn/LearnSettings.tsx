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
  const [checkAnswers, setCheckAnswers] = useState(false);
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
    return verbs.filter((verb) =>
      selectedLetters.has(verb.infinitive.charAt(0).toLowerCase())
    );
  }, [verbs, selectedLetters]);

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

  const handleStartTest = () => {
    const params = new URLSearchParams({
      letters: Array.from(selectedLetters).sort().join(','),
      checkAnswers: checkAnswers ? '1' : '0',
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

        {/* Verb Count */}
        <div style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
          Words to practice: <span className="font-bold">{filteredVerbs.length}</span> / {verbs.length}
        </div>

        {/* Check Answers Toggle */}
        <div className="flex items-center gap-4">
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
          disabled={filteredVerbs.length === 0}
          className="px-8 py-4 text-xl font-semibold rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: filteredVerbs.length > 0 ? '#f8f8f8' : '#ccc',
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

