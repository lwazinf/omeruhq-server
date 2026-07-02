import React from "react";

// ============================================================================
// components/chat/Icons.tsx
// Small inline SVG icons (currentColor) approximating WhatsApp's icon set.
// ============================================================================

type P = React.SVGProps<SVGSVGElement> & { size?: number };

function S({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowLeft = (p: P) => (
  <S {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const VideoCam = (p: P) => (
  <S {...p}>
    <rect x="2.5" y="6.5" width="12" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14.5 10.5l5-3v9l-5-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </S>
);

export const Phone = (p: P) => (
  <S {...p}>
    <path d="M6.6 10.8a13 13 0 0 0 5.6 5.6l1.9-1.9c.24-.24.6-.32.9-.2 1 .33 2.05.51 3.1.51.55 0 1 .45 1 1V19c0 .55-.45 1-1 1A16 16 0 0 1 4 5c0-.55.45-1 1-1h3.1c.55 0 1 .45 1 1 0 1.06.18 2.1.51 3.1.1.31.03.66-.21.9l-1.9 1.8z" fill="currentColor" />
  </S>
);

export const Dots = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="5" r="1.8" fill="currentColor" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    <circle cx="12" cy="19" r="1.8" fill="currentColor" />
  </S>
);

export const Search = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </S>
);

export const Smiley = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="9" cy="10" r="1.1" fill="currentColor" />
    <circle cx="15" cy="10" r="1.1" fill="currentColor" />
    <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </S>
);

export const Paperclip = (p: P) => (
  <S {...p}>
    <path d="M16.5 6.5l-7.8 7.8a2.5 2.5 0 1 0 3.5 3.5l8-8a4.5 4.5 0 0 0-6.4-6.4l-8 8a6.5 6.5 0 0 0 9.2 9.2l6.3-6.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" transform="scale(0.85) translate(2 1)" />
  </S>
);

export const Camera = (p: P) => (
  <S {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
  </S>
);

export const Mic = (p: P) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </S>
);

export const Send = (p: P) => (
  <S {...p}>
    <path d="M3.5 12l16-7.5-4 16-3.8-5.2L3.5 12z" fill="currentColor" />
  </S>
);

export const CheckSingle = (p: P) => (
  <S {...p} viewBox="0 0 18 18">
    <path d="M2 9.5l3.8 3.8L15 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </S>
);

export const CheckDouble = (p: P) => (
  <S {...p} viewBox="0 0 20 18">
    <path d="M1 9.5l3.6 3.6L13 4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M6.5 12.8L9.3 9.8M9.5 9.6L18 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </S>
);

export const Clock = (p: P) => (
  <S {...p} viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
    <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </S>
);

export const DocFile = (p: P) => (
  <S {...p}>
    <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </S>
);

export const Download = (p: P) => (
  <S {...p}>
    <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const Pin = (p: P) => (
  <S {...p}>
    <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" />
  </S>
);

export const Play = (p: P) => (
  <S {...p}>
    <path d="M7 5l12 7-12 7V5z" fill="currentColor" />
  </S>
);

export const Pause = (p: P) => (
  <S {...p}>
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
  </S>
);

export const Replay = (p: P) => (
  <S {...p}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v3.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </S>
);

export const SkipEnd = (p: P) => (
  <S {...p}>
    <path d="M5 5l9 7-9 7V5z" fill="currentColor" />
    <rect x="16" y="5" width="3" height="14" rx="1" fill="currentColor" />
  </S>
);

export const ChevronDown = (p: P) => (
  <S {...p}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

export const ListRows = (p: P) => (
  <S {...p}>
    <circle cx="5" cy="7" r="1.4" fill="currentColor" />
    <circle cx="5" cy="12" r="1.4" fill="currentColor" />
    <circle cx="5" cy="17" r="1.4" fill="currentColor" />
    <path d="M9 7h11M9 12h11M9 17h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </S>
);

export const Reply = (p: P) => (
  <S {...p}>
    <path d="M10 8L4 13l6 5v-3.5c5 0 8 1.5 9 5 .5-6-2.5-10-9-10V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
  </S>
);

export const Pencil = (p: P) => (
  <S {...p}>
    <path d="M5 19h3l9.5-9.5a2.1 2.1 0 0 0-3-3L5 16v3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
  </S>
);

export const External = (p: P) => (
  <S {...p}>
    <path d="M8 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </S>
);

export const UserIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </S>
);

export const Star = (p: P) => (
  <S {...p} viewBox="0 0 16 16">
    <path d="M8 1.5l1.8 4 4.3.4-3.3 2.8 1 4.2L8 10.7 4.2 12.9l1-4.2L1.9 5.9l4.3-.4L8 1.5z" fill="currentColor" />
  </S>
);

export const Lock = (p: P) => (
  <S {...p} viewBox="0 0 16 16">
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor" />
    <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </S>
);

export const Sparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" />
    <path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" fill="currentColor" opacity="0.7" />
  </S>
);

export const Plus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </S>
);

export const Copy = (p: P) => (
  <S {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" />
  </S>
);

export const Trash = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);
