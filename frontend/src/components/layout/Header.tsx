// Minimal Header - Error Free
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/Button";

export function Header() {
  return (
    <header className="h-[72px] bg-[#0B2545] border-b border-gray-700 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image
          src="/af_logo.png"
          alt="Air Force Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <h1 className="text-white text-lg font-bold">Analyst Copilot</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/upload">
          <Button variant="secondary">Upload</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Dashboard</Button>
        </Link>
        <Button variant="secondary">Export</Button>
      </div>
    </header>
  );
}
