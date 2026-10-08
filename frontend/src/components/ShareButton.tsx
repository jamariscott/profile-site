import { useState } from "react";
import { ShareIcon, CheckIcon } from "./icons";

/** Copies (or native-shares) a public URL. For profiles the URL is computed
 * from `username` rather than the current page location, so it's correct even
 * inside the Account editor's preview; pass `path` to share any other page. */
export default function ShareButton({
  username,
  path,
  displayName,
  label = "Share profile",
}: {
  username?: string;
  path?: string;
  displayName: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path ?? `/u/${username}`}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
      } catch {
        /* user cancelled the share sheet — not an error */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-btn border border-line bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors text-sm"
    >
      {copied ? <CheckIcon size={16} className="text-success" /> : <ShareIcon size={16} />}
      <span className="hidden sm:inline" aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
