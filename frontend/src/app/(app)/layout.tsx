import { Navbar } from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-champions-dark">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20">{children}</main>
    </div>
  );
}
