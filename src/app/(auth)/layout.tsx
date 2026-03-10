import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-6">
        <Link href="/" className="inline-block">
          <Image
            src="/2tb.svg"
            alt="Alignment Retreats"
            width={80}
            height={80}
            className="h-20 w-20"
            priority
          />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </div>
    </div>
  );
}
