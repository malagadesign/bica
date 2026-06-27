import { FlaskConical } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2 font-semibold">
        <FlaskConical className="size-6" />
        <span className="text-xl">Cosing AR</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
