"use client";

import { useState } from "react";
import { Share2, Check, Link } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => copyFallback());
    } else {
      copyFallback();
    }
  }

  function copyFallback() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-5 py-3 rounded-lg border border-dj-border text-dj-text hover:border-dj-primary/50 hover:text-dj-primary-light transition-all text-sm font-medium"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400">Link Copied!</span>
        </>
      ) : (
        <>
          <Link className="w-4 h-4" />
          Share Event
        </>
      )}
    </button>
  );
}
