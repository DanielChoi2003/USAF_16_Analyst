// Minimal Header - Error Free
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09111d]/90 backdrop-blur">
      <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Image
              src="/af_logo.png"
              alt="Air Force Logo"
              width={26}
              height={26}
              className="object-contain"
            />
          </div>
          <p className="font-display text-base font-semibold text-white">
            Analyst Copilot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/analysis/index">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Results
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/upload">
            <Button className="gap-2">
              Upload
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
