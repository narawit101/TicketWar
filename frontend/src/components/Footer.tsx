import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#252525] bg-[#121212] py-5 px-4 md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#888888]">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-[#1ed760] flex items-center justify-center font-bold text-black text-[10px] select-none">
            TW
          </div>
          <span className="font-semibold text-zinc-300">
            Ticket<span className="text-[#1ed760]">War</span>
          </span>
          {/* <span className="text-[#444444]">•</span> */}
          {/* <span className="text-[#727272]">Realtime War Room</span> */}
        </div>

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
