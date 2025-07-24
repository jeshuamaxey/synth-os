import Link from 'next/link';

export default function TopNav() {
  return (
    <nav className="w-full bg-background border-b border-border mb-6">
      <div className="max-w-4xl mx-auto flex items-center gap-6 px-4 h-14">
        <Link href="/vibe-shifter" className="font-medium hover:underline">Vibe Shifter</Link>
        <Link href="/sample-library" className="font-medium hover:underline">Sample Library</Link>
      </div>
    </nav>
  );
} 