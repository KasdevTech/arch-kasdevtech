import type { AnchorHTMLAttributes, ReactNode } from "react";

interface HardLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

export function HardLink({ to, children, ...rest }: HardLinkProps) {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
