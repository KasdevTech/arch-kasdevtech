import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

interface HardLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

export function HardLink({ to, children, ...rest }: HardLinkProps) {
  const isHash = to.startsWith("#");
  const isExternal = /^https?:\/\//.test(to) || to.startsWith("mailto:");
  const target = rest.target;

  if (isHash || isExternal || target === "_blank") {
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}
