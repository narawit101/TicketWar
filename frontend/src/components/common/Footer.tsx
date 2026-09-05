import React from "react";
import Link from "next/link";
import { TicketWarLogo } from "./TicketWarLogo";

const FOOTER_LINKS = [
  { label: "ห้องแชท", href: "/", isExternal: false },
  {
    label: "ThaiTicketMajor",
    href: "https://www.thaiticketmajor.com",
    isExternal: true,
  },
  { label: "AllTicket", href: "https://www.allticket.com", isExternal: true },
  { label: "Eventpop", href: "https://www.eventpop.me", isExternal: true },
  { label: "Zipevent", href: "https://www.zipeventapp.com", isExternal: true },
  {
    label: "Ticketmelon",
    href: "https://www.ticketmelon.com/th",
    isExternal: true,
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#252525] bg-[#121212] py-5 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#888888]">
        {/* Brand */}
        <Link
          href="/"
          className="hover:opacity-80 transition inline-flex items-center gap-2.5 cursor-pointer shrink-0"
          title="กลับสู่หน้าหลัก TicketWar"
        >
          <TicketWarLogo size={22} showText textSize="text-sm font-semibold" />
        </Link>

        {/* Fast Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          {FOOTER_LINKS.map((link) =>
            link.isExternal ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-[#666666] shrink-0 text-center">
          © {new Date().getFullYear()} TicketWar
        </div>
      </div>
    </footer>
  );
};
