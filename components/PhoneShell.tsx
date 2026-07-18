// Frames the mobile screens like a device on desktop, full-bleed on phones.
// The design is phone-first (QR lands here); this keeps it looking intentional
// on a laptop during the demo without touching the screen layouts themselves.
export default function PhoneShell({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-0 sm:p-6">
      <div
        className={`relative flex w-full max-w-[430px] flex-col overflow-hidden sm:h-[880px] sm:rounded-[44px] sm:border-8 sm:border-ink sm:shadow-2xl ${
          dark ? "bg-ink" : "bg-paper"
        }`}
      >
        {/* notch — desktop only */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden h-6 w-36 -translate-x-1/2 rounded-b-2xl bg-ink sm:block" />
        <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
