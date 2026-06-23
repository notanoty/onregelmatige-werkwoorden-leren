import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans" style={{ backgroundColor: "#FFDAB9" }}>
      <main className="flex flex-col items-center justify-center gap-8 px-16">
        <h1 className="text-4xl font-bold" style={{ color: "#1a1a1a" }}>
          Onregelmatige Werkwoorden
        </h1>
        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/learn"
            className="px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-center"
            style={{
              backgroundColor: "#f8f8f8",
              color: "#1a1a1a",
              border: "2px solid #1a1a1a",
            }}
          >
            Learn Irregular Words
          </Link>
          <Link
            href="/words"
            className="px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 text-center"
            style={{
              backgroundColor: "#f8f8f8",
              color: "#1a1a1a",
              border: "2px solid #1a1a1a",
            }}
          >
            View All Words
          </Link>
        </div>
      </main>
    </div>
  );
}
