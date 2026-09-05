import React from "react";
import Link from "next/link";
import { TicketWarLogo } from "./TicketWarLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#252525] bg-[#121212] py-5 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#888888]">
        {/* Brand */}
        <Link
          href="/"
          className="hover:opacity-80 transition inline-flex items-center gap-2.5 cursor-pointer"
          title="กลับสู่หน้าหลัก TicketWar"
        >
          <TicketWarLogo size={22} showText textSize="text-sm font-semibold" />
        </Link>

        {/* Fast Links */}
        <div className="flex items-center gap-4 text-xs">
          <Link href="/" className="hover:text-white transition-colors">
            ห้องแชท
          </Link>
          <a
            href="https://www.thaiticketmajor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            ThaiTicketMajor
          </a>
          <a
            href="https://www.allticket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            AllTicket
          </a>
          <a
            href="https://www.eventpop.me"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Eventpop
          </a>
        </div>

        {/* Copyright */}
        <div className="text-[11px] text-[#666666]">
          © {new Date().getFullYear()} TicketWar
        </div>
      </div>
    </footer>
  );
};
