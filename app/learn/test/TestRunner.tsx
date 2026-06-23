'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type AuxiliaryVerb = 'hebben' | 'zijn' | 'hebben/zijn';
type SelectableAuxiliaryVerb = 'hebben' | 'zijn';
type LanguageCode = 'en' | 'ru';

export type TestVerb = {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: AuxiliaryVerb;
  translations?: {
    en?: string;
    ru?: string;
  };
};

type UserAnswer = {
  infinitive: string;
  pastSingular: string;
  pastPlural: string;
  pastParticiple: string;
  auxiliary: SelectableAuxiliaryVerb | '';
};

type AnswerRecord = {
  verb: TestVerb;
  prompt: string;
  userAnswer: UserAnswer;
  isCorrect: boolean;
};

type TestRunnerProps = {
  verbs: TestVerb[];
  checkAnswers: boolean;
  translationLanguage: LanguageCode;
};

const languageLabels: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
};

function shuffleVerbs(verbs: TestVerb[]): TestVerb[] {
  const shuffled = [...verbs];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesExpectedValue(userValue: string, expectedValue: string): boolean {
  const normalizedUserValue = normalize(userValue);

  if (expectedValue === '—') {
    return normalizedUserValue === '' || normalizedUserValue === '—';
  }

  return expectedValue
    .split('/')
    .map((option) => normalize(option))
    .some((option) => option === normalizedUserValue);
}

function createEmptyAnswer(): UserAnswer {
  return {
    infinitive: '',
    pastSingular: '',
    pastPlural: '',
    pastParticiple: '',
    auxiliary: '',
  };
}

export function TestRunner({ verbs, checkAnswers, translationLanguage }: TestRunnerProps) {
  const isAnswerMode = checkAnswers;
  const randomizedVerbs = useMemo(() => shuffleVerbs(verbs), [verbs]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer>(createEmptyAnswer());
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentVerb = randomizedVerbs[currentIndex];
  const totalWords = randomizedVerbs.length;
  const prompt = currentVerb?.translations?.[translationLanguage] || currentVerb?.infinitive || '';

  const correctAnswersCount = useMemo(
    () => answers.filter((answer) => answer.isCorrect).length,
    [answers]
  );

  const handleAnswerChange = (field: keyof UserAnswer, value: string) => {
    setCurrentAnswer((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const moveToNextCard = () => {
    if (!currentVerb) {
      return;
    }

    const isCorrect =
      matchesExpectedValue(currentAnswer.infinitive, currentVerb.infinitive) &&
      matchesExpectedValue(currentAnswer.pastSingular, currentVerb.pastSingular) &&
      matchesExpectedValue(currentAnswer.pastPlural, currentVerb.pastPlural) &&
      matchesExpectedValue(currentAnswer.pastParticiple, currentVerb.pastParticiple) &&
      matchesExpectedValue(currentAnswer.auxiliary, currentVerb.auxiliary);

    setAnswers((previous) => [
      ...previous,
      {
        verb: currentVerb,
        prompt,
        userAnswer: currentAnswer,
        isCorrect,
      },
    ]);

    const isLastCard = currentIndex === randomizedVerbs.length - 1;

    if (isLastCard) {
      setIsFinished(true);
      setCurrentAnswer(createEmptyAnswer());
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setCurrentAnswer(createEmptyAnswer());
  };

  if (totalWords === 0) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen font-sans py-8" style={{ backgroundColor: '#FFDAB9' }}>
        <main className="flex flex-col gap-8 px-8 max-w-2xl w-full">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>
              Testing
            </h1>
            <Link
              href="/"
              className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
            >
              ← Home
            </Link>
          </div>

          <p className="text-lg font-semibold" style={{ color: '#1a1a1a' }}>
            No words are available for this test selection.
          </p>

          <Link
            href="/learn"
            className="px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-center"
            style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
          >
            Back to Settings
          </Link>
        </main>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen font-sans py-8" style={{ backgroundColor: '#FFDAB9' }}>
        <main className="flex flex-col gap-8 px-8 max-w-6xl w-full">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>
              {isAnswerMode ? 'Results' : 'Shown Words'}
            </h1>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/"
                className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
              >
                ← Home
              </Link>
              <Link
                href="/learn"
                className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
              >
                Back to Settings
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-lg font-semibold" style={{ color: '#1a1a1a' }}>
            <p>Words shown: {answers.length}</p>
            <p>Translation language: {languageLabels[translationLanguage]}</p>
            <p>Check answers: {checkAnswers ? 'Yes' : 'No'}</p>
            {isAnswerMode ? <p>Correct answers: {correctAnswersCount} / {answers.length}</p> : null}
          </div>

          <div className="overflow-x-auto rounded-lg border-2" style={{ borderColor: '#1a1a1a' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#1a1a1a' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>#</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Shown word</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Infinitive</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Past singular</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Past plural</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Past participle</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Auxiliary</th>
                  {isAnswerMode ? (
                    <>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Your answer</th>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: '#f8f8f8' }}>Result</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {answers.map((answer, index) => (
                  <tr
                    key={`${answer.verb.infinitive}-${index}`}
                    style={{ backgroundColor: index % 2 === 0 ? '#f8f8f8' : '#fff' }}
                  >
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{index + 1}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{answer.prompt}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1a1a1a' }}>{answer.verb.infinitive}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{answer.verb.pastSingular}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{answer.verb.pastPlural}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{answer.verb.pastParticiple}</td>
                    <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>{answer.verb.auxiliary}</td>
                    {isAnswerMode ? (
                      <>
                        <td className="px-4 py-3" style={{ color: '#1a1a1a' }}>
                          <div>{answer.userAnswer.infinitive || '—'}</div>
                          <div>{answer.userAnswer.pastSingular || '—'}</div>
                          <div>{answer.userAnswer.pastPlural || '—'}</div>
                          <div>{answer.userAnswer.pastParticiple || '—'}</div>
                          <div>{answer.userAnswer.auxiliary || '—'}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold" style={{ color: answer.isCorrect ? '#166534' : '#991b1b' }}>
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen font-sans py-8" style={{ backgroundColor: '#FFDAB9' }}>
      <main className="flex flex-col gap-8 px-8 max-w-2xl w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>
            Testing
          </h1>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
            >
              ← Home
            </Link>
            <Link
              href="/learn"
              className="px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
            >
              Back to Settings
            </Link>
          </div>
        </div>

        <div style={{ color: '#1a1a1a' }} className="text-lg font-semibold">
          <p>Card {currentIndex + 1} / {totalWords}</p>
          <p>Mode: {isAnswerMode ? 'Answer the cards' : 'Review words only'}</p>
          <p>Translation language: {languageLabels[translationLanguage]}</p>
        </div>

        <div
          className="rounded-2xl border-2 p-8 shadow-sm"
          style={{ backgroundColor: '#f8f8f8', borderColor: '#1a1a1a', color: '#1a1a1a' }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide">Shown word</p>
          <h2 className="mt-3 text-3xl font-bold">{prompt}</h2>
        </div>

        {isAnswerMode ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-lg font-semibold sm:col-span-2" style={{ color: '#1a1a1a' }}>
              Infinitive
              <input
                value={currentAnswer.infinitive}
                onChange={(event) => handleAnswerChange('infinitive', event.target.value)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#f8f8f8', border: '2px solid #1a1a1a' }}
              />
            </label>

            <label className="flex flex-col gap-2 text-lg font-semibold" style={{ color: '#1a1a1a' }}>
              Past singular
              <input
                value={currentAnswer.pastSingular}
                onChange={(event) => handleAnswerChange('pastSingular', event.target.value)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#f8f8f8', border: '2px solid #1a1a1a' }}
              />
            </label>

            <label className="flex flex-col gap-2 text-lg font-semibold" style={{ color: '#1a1a1a' }}>
              Past plural
              <input
                value={currentAnswer.pastPlural}
                onChange={(event) => handleAnswerChange('pastPlural', event.target.value)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#f8f8f8', border: '2px solid #1a1a1a' }}
              />
            </label>

            <label className="flex flex-col gap-2 text-lg font-semibold sm:col-span-2" style={{ color: '#1a1a1a' }}>
              Past participle
              <input
                value={currentAnswer.pastParticiple}
                onChange={(event) => handleAnswerChange('pastParticiple', event.target.value)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#f8f8f8', border: '2px solid #1a1a1a' }}
              />
            </label>

            <label className="flex flex-col gap-2 text-lg font-semibold sm:col-span-2" style={{ color: '#1a1a1a' }}>
              Auxiliary verb
              <select
                value={currentAnswer.auxiliary}
                onChange={(event) => handleAnswerChange('auxiliary', event.target.value)}
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#f8f8f8', border: '2px solid #1a1a1a' }}
              >
                <option value="">Select auxiliary</option>
                <option value="hebben">hebben</option>
                <option value="zijn">zijn</option>
              </select>
            </label>
          </div>
        ) : (
            <div></div>
          // <div
          //   className="rounded-2xl border-2 p-6"
          //   style={{ backgroundColor: '#f8f8f8', borderColor: '#1a1a1a', color: '#1a1a1a' }}
          // >
          //   <p className="text-lg font-semibold">Answer fields are hidden because check answers is not selected.</p>
          //   <p className="mt-2">Click through the cards and review all shown words in order at the end.</p>
          // </div>
        )}

        <button
          type="button"
          onClick={moveToNextCard}
          className="px-8 py-4 text-xl font-semibold rounded-lg transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: '#f8f8f8', color: '#1a1a1a', border: '2px solid #1a1a1a' }}
        >
          {currentIndex === totalWords - 1 ? 'Finish Test' : 'Next Card'}
        </button>
      </main>
    </div>
  );
}

