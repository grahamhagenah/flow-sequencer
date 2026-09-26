// Small line icons, drawn in the button's text colour.

function Icon({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);

/** Save to My flows: a bookmark, "keep this in my list". */
export const SaveIcon = () => (
  <Icon>
    <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Icon>
);

/** A new flow: a blank page with a plus, so it isn't mistaken for adding a pose. */
export const NewFlowIcon = () => (
  <Icon>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M12 11v6M9 14h6" />
  </Icon>
);

export const LinkIcon = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </Icon>
);

/** My flows: a shelf of books, your library of flows. */
export const FlowsIcon = () => (
  <Icon>
    <path d="M5 4v16M9 4v16" />
    <path d="M13 5.5l4.5 14" />
    <path d="M3 20h18" />
  </Icon>
);

export const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Icon>
);

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const MinusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <path d="M8 5v14M16 5v14" strokeWidth="3" />
  </Icon>
);

export const BackIcon = () => (
  <Icon>
    <path d="M18 5v14L8 12z" fill="currentColor" />
    <path d="M6 5v14" strokeWidth="2.5" />
  </Icon>
);

export const ForwardIcon = () => (
  <Icon>
    <path d="M6 5v14l10-7z" fill="currentColor" />
    <path d="M18 5v14" strokeWidth="2.5" />
  </Icon>
);

/** Outlined and a little smaller than the skip buttons, so it reads as the quieter action. */
export const StopIcon = () => (
  <Icon>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
  </Icon>
);

/** The player's settings: voice, pace and sounds, so a speaker. */
export const SettingsIcon = () => (
  <Icon>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <path d="M5 12.5 10 17.5 19 7" />
  </Icon>
);

export const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
);

export const ArrowLeftIcon = () => (
  <Icon>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const ChevronIcon = ({ dir, size = 18 }: { dir: 'left' | 'right' | 'down'; size?: number }) => (
  <Icon size={size}>
    <path d={{ left: 'm15 6-6 6 6 6', right: 'm9 6 6 6-6 6', down: 'm6 9 6 6 6-6' }[dir]} />
  </Icon>
);

/** The ⋯ on each row: three filled dots rather than strokes. */
export const MoreIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);

export const TrashIcon = () => (
  <Icon>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V4h6v3" />
  </Icon>
);

/** Cut the flow here: everything from this pose on goes. */
export const ScissorsIcon = () => (
  <Icon>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
  </Icon>
);
