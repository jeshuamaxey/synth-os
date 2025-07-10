import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>11 labs</h1>
      <Link
        className="text-blue-500 hover:underline"
        href="/vibe-shifter"
      >
        Play the Vibe Shifter
      </Link>
    </div>
  );
}
