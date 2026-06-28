import Link from "next/link";

type DisclaimerLinkProps = {
  className?: string;
  label?: string;
};

export function DisclaimerLink({
  className = "text-primary underline-offset-4 hover:underline",
  label = "Aviso legal",
}: DisclaimerLinkProps) {
  return (
    <Link href="/legal/disclaimer" className={className}>
      {label}
    </Link>
  );
}
