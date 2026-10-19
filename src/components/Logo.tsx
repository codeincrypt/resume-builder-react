import { Link } from "react-router-dom";

/** The CapitalCV mark: a document page whose top edge is a dome. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="#1f4fd8" />
      <path
        d="M9 24V14.5C9 10.9 12.1 8 16 8s7 2.9 7 6.5V24"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M12.5 19h7M12.5 22h4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="CapitalCV home">
      <LogoMark />
      <span className="logo__text">
        Capital<span>CV</span>
      </span>
    </Link>
  );
}
