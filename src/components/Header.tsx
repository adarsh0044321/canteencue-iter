import React from "react";
import { Menu, RotateCcw } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onReset: () => void;
  isChatActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onReset,
}) => {
  return (
    <header className="site-header-wrapper" role="banner">
      <div className="site-header">
        {/* Top Left: Mobile menu trigger + Brand Name (Clean text, no icon image in header) */}
        <div className="site-header-left">
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Open navigation menu"
            aria-label="Open navigation menu"
            className="sidebar-toggle-mobile-btn"
          >
            <Menu size={18} />
          </button>

          <a
            className="brand brand-header-left"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onReset();
            }}
            aria-label="CanteenCue Home"
          >
            <span className="brand-text">
              Canteen<span className="brand-accent">Cue</span>
            </span>
          </a>
        </div>

        {/* Top Right: New Decision Button (Distinguishable Dark Black, Highly Readable) */}
        <div className="site-header-right">
          <button
            type="button"
            className="btn-header-new-decision"
            onClick={onReset}
            title="Start a new food decision"
            aria-label="Start a new food decision"
          >
            <RotateCcw size={14} />
            <span>New Decision</span>
          </button>
        </div>
      </div>
    </header>
  );
};
