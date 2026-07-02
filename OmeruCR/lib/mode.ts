// Platform mode as seen by the Control Room. Mirror the bot's DEMO_MODE env
// in this deployment so the chip in the header reflects reality. This is the
// ONLY surface that ever reveals the mode — customers and merchants must
// never see demo/maintenance state.
export const platformMode = (): 'DEMO' | 'LIVE' =>
  (process.env.DEMO_MODE || 'false').toLowerCase() === 'true' ? 'DEMO' : 'LIVE';
