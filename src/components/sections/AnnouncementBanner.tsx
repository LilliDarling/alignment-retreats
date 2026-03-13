"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AnnouncementBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-primary text-primary-foreground py-2 px-2 sm:px-4"
    >
      <div className="max-w-[1240px] mx-auto text-center text-[11px] sm:text-sm whitespace-nowrap">
        <span>Want to host retreats in 2026?</span>
        <Link
          href="/cooperative"
          className="font-semibold underline hover:opacity-80 ml-1 sm:ml-2"
        >
          Join now
        </Link>
      </div>
    </motion.div>
  );
}
