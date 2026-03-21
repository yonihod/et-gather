"use client";

import { useEffect } from "react";

const ASCII_ART = `
%c
  ╔══════════════════════════════════════╗
  ║                                      ║
  ║   ███████╗████████╗                  ║
  ║   ██╔════╝╚══██╔══╝                  ║
  ║   █████╗     ██║    GATHER           ║
  ║   ██╔══╝     ██║    ISRAEL 🇮🇱        ║
  ║   ███████╗   ██║                     ║
  ║   ╚══════╝   ╚═╝                     ║
  ║                                      ║
  ║   RTCW: Enemy Territory              ║
  ║   Community Platform                 ║
  ║                                      ║
  ╠══════════════════════════════════════╣
  ║                                      ║
  ║   /connect 84.229.240.21             ║
  ║                                      ║
  ║   Want to contribute?                ║
  ║   Join our Discord community.        ║
  ║                                      ║
  ╚══════════════════════════════════════╝
`;

/**
 * Logs a military-themed ASCII art to the browser console.
 * A little surprise for developers who open DevTools.
 */
export function ConsoleEasterEgg() {
  useEffect(() => {
    console.log(
      ASCII_ART,
      "color: #4CAF50; font-family: monospace; font-size: 11px; line-height: 1.3;"
    );
    console.log(
      "%cBuilt with ❤️ for the ET Israel community",
      "color: #B8860B; font-size: 12px; font-style: italic;"
    );
  }, []);

  return null;
}
