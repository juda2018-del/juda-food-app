import type { SVGProps } from "react";

export type FuseIconName =
  | "home"
  | "search"
  | "reels"
  | "orders"
  | "user"
  | "menu"
  | "pin"
  | "bell"
  | "sliders"
  | "heart"
  | "star"
  | "clock"
  | "grid"
  | "burger"
  | "pizza"
  | "grill"
  | "breakfast"
  | "drink"
  | "cart"
  | "comment"
  | "share"
  | "save"
  | "volume"
  | "mute"
  | "settings"
  | "logout"
  | "chevron-back"
  | "chevron-forward"
  | "plus"
  | "store"
  | "truck"
  | "shield"
  | "info"
  | "help"
  | "gift"
  | "map-pin";

export type FuseIconSize = "sm" | "md" | "lg";

const SIZE: Record<FuseIconSize, number> = { sm: 20, md: 22, lg: 24 };

type FuseIconProps = {
  name: FuseIconName;
  size?: FuseIconSize;
  className?: string;
};

export default function FuseIcon({ name, size = "md", className }: FuseIconProps) {
  const dim = SIZE[size];
  const p: SVGProps<SVGSVGElement> = {
    width: dim,
    height: dim,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className ? `fuse-icon ${className}` : "fuse-icon",
    "aria-hidden": true,
  };

  switch (name) {
    case "menu":
      return (
        <svg {...p}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "search":
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4" />
        </svg>
      );
    case "pin":
    case "map-pin":
      return (
        <svg {...p}>
          <path d="M12 21s6-5 6-11a6 6 0 10-12 0c0 6 6 11 6 11z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      );
    case "bell":
      return (
        <svg {...p}>
          <path d="M18 9a6 6 0 10-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9z" />
          <path d="M10 21h4" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...p}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
          <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "heart":
      return (
        <svg {...p}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" />
        </svg>
      );
    case "star":
      return (
        <svg {...p}>
          <path d="M12 3l2.7 5.4 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.3l6-.9L12 3z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "home":
      return (
        <svg {...p}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
        </svg>
      );
    case "reels":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <path d="m7 4 3 4m3-4 3 4m-13 0h18" />
          <path d="m10 12 5 3-5 3Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cart":
      return (
        <svg {...p}>
          <path d="M4 6h2l1.5 8h8l2-6H8" />
          <circle cx="10" cy="18" r="1.3" />
          <circle cx="16" cy="18" r="1.3" />
        </svg>
      );
    case "orders":
      return (
        <svg {...p}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "user":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6" />
        </svg>
      );
    case "grid":
      return (
        <svg {...p}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "burger":
      return (
        <svg {...p}>
          <path d="M5 10a7 7 0 0114 0H5z" />
          <path d="M4.5 13h15" />
          <path d="M5.5 16h13" />
          <path d="M7 19h10" />
        </svg>
      );
    case "pizza":
      return (
        <svg {...p}>
          <path d="M4 8c4-2 12-2 16 0L12 20 4 8z" />
          <circle cx="10" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "grill":
      return (
        <svg {...p}>
          <path d="M6 6c2-2 4-2 6 0s4 2 6 0" />
          <path d="M8 8l8 8" />
          <path d="M16 8l-8 8" />
        </svg>
      );
    case "breakfast":
      return (
        <svg {...p}>
          <path d="M7 6v6a4 4 0 004 4h1a4 4 0 004-4V6" />
          <path d="M7 10h10" />
          <path d="M9 4v2" />
          <path d="M12 4v2" />
          <path d="M15 4v2" />
        </svg>
      );
    case "drink":
      return (
        <svg {...p}>
          <path d="M8 4h8" />
          <path d="M10 4l1 16h2l1-16" />
          <path d="M12 4l4-2" />
        </svg>
      );
    case "comment":
      return (
        <svg {...p}>
          <path d="M21 12a8 8 0 01-8 8 8.5 8.5 0 01-4-.9L3 21l1.8-5A8 8 0 1121 12z" />
        </svg>
      );
    case "share":
      return (
        <svg {...p}>
          <circle cx="18" cy="5" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="M8 11l8-5M8 13l8 5" />
        </svg>
      );
    case "save":
      return (
        <svg {...p}>
          <path d="M6 4h12v17l-6-4-6 4V4z" />
        </svg>
      );
    case "volume":
      return (
        <svg {...p}>
          <path d="M5 9v6h4l5 4V5L9 9H5z" />
          <path d="M18 9a4 4 0 010 6" />
        </svg>
      );
    case "mute":
      return (
        <svg {...p}>
          <path d="M5 9v6h4l5 4V5L9 9H5z" />
          <path d="M18 9l4 4M22 9l-4 4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.38.37.73.66 1 .3.28.68.42 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.76.6Z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...p}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "chevron-back":
      return (
        <svg {...p}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case "chevron-forward":
      return (
        <svg {...p}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "store":
      return (
        <svg {...p}>
          <path d="M4 10V20h16V10" />
          <path d="M2 10l2-6h16l2 6" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "truck":
      return (
        <svg {...p}>
          <path d="M3 7h11v8H3z" />
          <path d="M14 10h4l3 3v2h-7v-5z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="17.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
        </svg>
      );
    case "info":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );
    case "help":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 014.8 1c0 2-3 2-3 4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "gift":
      return (
        <svg {...p}>
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13" />
          <path d="M3 12h18" />
          <path d="M12 8c-2-3-5-3-5 0s3 0 5 0 5-3 5 0-3 0-5 0" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
