"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-blue-700 to-indigo-800 shadow-xl backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-12 px-6 py-4">

        <Link
          href="/"
          className={`rounded-lg px-4 py-2 text-lg font-semibold transition-all duration-300 ${
            pathname === "/"
              ? "bg-white/20 text-white shadow-md"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          💬 Q&A
        </Link>

        <Link
          href="/polls"
          className={`rounded-lg px-4 py-2 text-lg font-semibold transition-all duration-300 ${
            pathname === "/polls"
              ? "bg-white/20 text-white shadow-md"
              : "text-blue-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          📊 Polls
        </Link>

      </div>
    </nav>
  );
}