type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Undo = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M8.5 6 4.5 10l4 4" /><path d="M4.5 10h9a5.5 5.5 0 0 1 0 11h-3" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
/** Shears. */
export const Shears = ({ size }: P) => <svg {...s(size)} aria-hidden><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /><path d="M9 15 16 3M15 15 8 3" /></svg>;
/** A shoot unfurling: grow a year. */
export const Sprout = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M12 21v-9" /><path d="M12 12c-4 0-6.5-2.5-7-6.5 4 0 6.5 2.3 7 6.5z" fill="currentColor" fillOpacity=".2" /><path d="M12 14.5c3.5 0 5.8-2.2 6.3-5.6-3.4 0-5.8 2-6.3 5.6z" fill="currentColor" fillOpacity=".2" /></svg>;
export const Garden = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4 20h16M6.5 20l1-3h9l1 3" /><path d="M12 17v-5c0-2 1.5-3 3-3.5M12 12c-1-1.5-3-2-4.5-1.5" /><ellipse cx="15.5" cy="7" rx="3.5" ry="2.2" /><ellipse cx="7.5" cy="9.5" rx="3" ry="1.8" /></svg>;
/** Stars are small potted trees. */
export const Tree = ({ size = 22, on, color = '#4f7a42' }: P & { on?: boolean; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M7 20.5h10l-1.2 2H8.2z" fill={on ? '#7a4a32' : 'none'} stroke={on ? 'none' : 'rgba(60,50,40,.35)'} strokeWidth="1" />
    <path d="M12 20.5v-6c0-1.6 1-2.6 2.4-3.2M12 15.5c-.9-1.3-2.5-1.8-3.8-1.3" stroke={on ? '#4a3426' : 'rgba(60,50,40,.35)'} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <ellipse cx="15" cy="9" rx="5" ry="3.2" fill={on ? color : 'none'} stroke={on ? 'none' : 'rgba(60,50,40,.35)'} strokeWidth="1" />
    <ellipse cx="7.5" cy="12.5" rx="3.6" ry="2.3" fill={on ? color : 'none'} stroke={on ? 'none' : 'rgba(60,50,40,.35)'} strokeWidth="1" />
  </svg>
);
