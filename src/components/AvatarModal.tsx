import React from "react";
import { X, Dices, Check } from "lucide-react";
import { AvatarGraphic } from "./AvatarGraphic";
import { CUTE_AVATARS, getRandomAvatarId } from "../data/avatars";

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string;
  onSelectAvatar: (id: string) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatarId,
  onSelectAvatar,
}) => {
  if (!isOpen) return null;

  const handleRandomize = () => {
    let next = getRandomAvatarId();
    // Try to pick a different one if possible
    if (next === currentAvatarId && CUTE_AVATARS.length > 1) {
      next = getRandomAvatarId();
    }
    onSelectAvatar(next);
  };

  return (
    <div
      className="avatar-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div
        className="avatar-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="avatar-modal-header">
          <div>
            <h3 id="avatar-modal-title" className="avatar-modal-title">
              Choose Your Mascot
            </h3>
            <p className="avatar-modal-subtitle">
              Pick a cute foodie companion for your canteen decisions
            </p>
          </div>
          <button
            type="button"
            className="avatar-modal-close-btn"
            onClick={onClose}
            aria-label="Close avatar picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Active Banner */}
        <div className="avatar-modal-current-banner">
          <AvatarGraphic avatarId={currentAvatarId} size={48} />
          <div className="avatar-modal-current-info">
            <span className="current-label">Currently Equipped</span>
            <span className="current-name">
              {CUTE_AVATARS.find((a) => a.id === currentAvatarId)?.name || "Foodie Mascot"}
            </span>
          </div>
          <button
            type="button"
            className="avatar-random-btn"
            onClick={handleRandomize}
            title="Pick a random mascot"
          >
            <Dices size={15} />
            <span>Randomize</span>
          </button>
        </div>

        {/* Avatar Grid */}
        <div className="avatar-grid">
          {CUTE_AVATARS.map((avatar) => {
            const isSelected = avatar.id === currentAvatarId;
            return (
              <button
                key={avatar.id}
                type="button"
                className={`avatar-card ${isSelected ? "avatar-card-selected" : ""}`}
                onClick={() => {
                  onSelectAvatar(avatar.id);
                  onClose();
                }}
              >
                <div className="avatar-graphic-wrap">
                  <AvatarGraphic avatarId={avatar.id} size={54} />
                  {isSelected && (
                    <div className="avatar-selected-badge">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="avatar-card-name">{avatar.name}</span>
                <span className="avatar-card-tag">{avatar.foodTag}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
