import React from "react";

export interface ChipOption {
  label: string;
  query: string;
  category?: "budget" | "time" | "dietary" | "craving";
}

const INITIAL_QUICK_CHIPS: ChipOption[] = [
  { label: "₹50", query: "I have ₹50" },
  { label: "₹100", query: "I have ₹100" },
  { label: "₹150", query: "I have ₹150" },
  { label: "10 min", query: "I only have 10 minutes" },
  { label: "15 min", query: "I have 15 minutes" },
  { label: "Vegetarian", query: "I want vegetarian food" },
  { label: "Spicy", query: "Something spicy" },
  { label: "Filling", query: "Something filling" },
  { label: "Something light", query: "Something light" },
];

interface QuickChipsProps {
  chips?: ChipOption[];
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export const QuickChips: React.FC<QuickChipsProps> = ({
  chips = INITIAL_QUICK_CHIPS,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="quick-chips-container" role="group" aria-label="Quick preference options">
      {chips.map((chip, index) => (
        <button
          key={`${chip.label}-${index}`}
          type="button"
          className="chip"
          disabled={disabled}
          onClick={() => onSelect(chip.query)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};
