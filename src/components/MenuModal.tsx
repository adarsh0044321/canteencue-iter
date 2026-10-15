import React, { useState, useMemo } from "react";
import { ALL_MENU_ITEMS } from "../data/menuService";
import { ShopName } from "../data/types";
import { X, Sparkles, ArrowUpDown, Clock, Search, Star, Filter } from "lucide-react";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (name: string) => void;
}

type SortOption = "default" | "price_asc" | "price_desc" | "time_asc" | "name_asc" | "rating_desc";
type DietFilter = "all" | "veg" | "nonveg" | "egg";

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const [selectedShop, setSelectedShop] = useState<ShopName | "All">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const filteredItems = useMemo(() => {
    let items = ALL_MENU_ITEMS.filter((item) => {
      // 1. Shop filter
      if (selectedShop !== "All" && item.shop !== selectedShop) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesShop = item.shop.toLowerCase().includes(query);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(query));
        const matchesIngredients = (item.ingredients || []).some((i) => i.toLowerCase().includes(query));
        if (!matchesName && !matchesCat && !matchesShop && !matchesTags && !matchesIngredients) {
          return false;
        }
      }

      // 3. Dietary filter
      if (dietFilter === "veg" && item.dietary !== "vegetarian") return false;
      if (dietFilter === "nonveg" && item.dietary !== "non_vegetarian") return false;
      if (dietFilter === "egg" && item.dietary !== "contains_egg") return false;

      // 4. Max Price filter
      if (maxPriceFilter !== null && item.price > maxPriceFilter) return false;

      return true;
    });

    // Apply Sorting
    if (sortBy === "price_asc") {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      items.sort((a, b) => b.price - a.price);
    } else if (sortBy === "time_asc") {
      items.sort(
        (a, b) => (a.estimatedPreparationTime || 15) - (b.estimatedPreparationTime || 15)
      );
    } else if (sortBy === "name_asc") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "rating_desc") {
      // Assign stable synthetic rating 4.0 - 4.9 based on id hash for demo
      const getRating = (id: string) => 4.0 + (id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 10) / 10;
      items.sort((a, b) => getRating(b.id) - getRating(a.id));
    }

    return items;
  }, [selectedShop, searchQuery, dietFilter, maxPriceFilter, sortBy]);

  if (!isOpen) return null;

  const getItemRating = (id: string) => {
    return (4.1 + (id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9) / 10).toFixed(1);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Canteen Menu Catalog"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "780px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Campus Menu Catalog
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
              6 Live Outlets • {filteredItems.length} of {ALL_MENU_ITEMS.length} dishes showing
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Search Bar */}
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${ALL_MENU_ITEMS.length}+ items by name, category, shake, juice, or craving...`}
            style={{
              width: "100%",
              padding: "10px 38px 10px 40px",
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Outlet Tabs */}
        <div style={{ marginBottom: "12px" }}>
          <div className="menu-shop-tabs" style={{ flexWrap: "wrap", gap: "6px" }}>
            {(["All", "Anna's Restaurant & Catering", "Mughlai Affair's", "HALKA PHULKA", "MAGGIE POINT", "4TH FLOOR", "Iter Juice Centre"] as const).map((shop) => (
              <button
                key={shop}
                type="button"
                className={`chip ${selectedShop === shop ? "chip--active" : ""}`}
                onClick={() => setSelectedShop(shop)}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {shop === "Anna's Restaurant & Catering"
                  ? "Anna's"
                  : shop === "Mughlai Affair's"
                  ? "Mughlai"
                  : shop === "Iter Juice Centre"
                  ? "Juice Centre"
                  : shop}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Sort Controls Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "14px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Quick Dietary and Price Filter Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
              <Filter size={12} /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                borderColor: dietFilter === "veg" ? "rgba(255, 255, 255, 0.32)" : "rgba(255, 255, 255, 0.12)",
                background: dietFilter === "veg" ? "rgba(255, 255, 255, 0.15)" : "rgba(0,0,0,0.2)",
                color: dietFilter === "veg" ? "#ffffff" : "#cbd5e1",
              }}
            >
              Veg Only
            </button>
            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === "nonveg" ? "all" : "nonveg")}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                borderColor: dietFilter === "nonveg" ? "#f43f5e" : "rgba(255, 255, 255, 0.12)",
                background: dietFilter === "nonveg" ? "rgba(244, 63, 94, 0.2)" : "rgba(0,0,0,0.2)",
                color: dietFilter === "nonveg" ? "#fb7185" : "#cbd5e1",
              }}
            >
              Non-Veg
            </button>
            <button
              type="button"
              onClick={() => setMaxPriceFilter(maxPriceFilter === 60 ? null : 60)}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                borderColor: maxPriceFilter === 60 ? "#2dd4bf" : "rgba(255, 255, 255, 0.12)",
                background: maxPriceFilter === 60 ? "rgba(20, 184, 166, 0.2)" : "rgba(0,0,0,0.2)",
                color: maxPriceFilter === 60 ? "#2dd4bf" : "#cbd5e1",
              }}
            >
              ≤ ₹60
            </button>
            <button
              type="button"
              onClick={() => setMaxPriceFilter(maxPriceFilter === 100 ? null : 100)}
              style={{
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                borderColor: maxPriceFilter === 100 ? "#2dd4bf" : "rgba(255, 255, 255, 0.12)",
                background: maxPriceFilter === 100 ? "rgba(20, 184, 166, 0.2)" : "rgba(0,0,0,0.2)",
                color: maxPriceFilter === 100 ? "#2dd4bf" : "#cbd5e1",
              }}
            >
              ≤ ₹100
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11.5px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="default">Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="time_asc">Fastest Prep Time</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Menu Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "55vh", overflowY: "auto", paddingRight: "4px" }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "13.5px" }}>
              No dishes found matching your current search and filters.
              <br />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDietFilter("all");
                  setMaxPriceFilter(null);
                  setSelectedShop("All");
                }}
                className="chip"
                style={{ marginTop: "12px", fontSize: "12px" }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const portionText = item.portionOptions
                ? item.portionOptions.map((p) => `${p.portion === "half" ? "Half" : "Full"}: ₹${p.price}`).join(" | ")
                : `₹${item.price}`;

              const rating = getItemRating(item.id);

              return (
                <div key={item.id} className="menu-item-row" style={{ padding: "12px 14px" }}>
                  <div style={{ flex: "1 1 auto", paddingRight: "14px" }}>
                    <div className="menu-item-name" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "14.5px" }}>{item.name}</span>
                      {!item.availability && (
                        <span className="menu-badge-unavailable">
                          Marked Unavailable
                        </span>
                      )}
                      {/* Rating Badge */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.35)",
                          color: "#f59e0b",
                        }}
                      >
                        <Star size={10} fill="#f59e0b" />
                        <span>{rating}</span>
                      </span>
                    </div>

                    <div className="menu-item-meta" style={{ marginTop: "6px" }}>
                      <span className="badge-meta" style={{ color: "#2dd4bf", borderColor: "rgba(20, 184, 166, 0.3)" }}>
                        {item.shop}
                      </span>

                      <span className="badge-meta">{item.category}</span>

                      {item.dietary === "vegetarian" ? (
                        <span className="badge-dietary badge-veg">Veg</span>
                      ) : item.dietary === "contains_egg" ? (
                        <span className="badge-dietary badge-egg">Egg</span>
                      ) : (
                        <span className="badge-dietary badge-nonveg">Non-Veg</span>
                      )}

                      {item.estimatedPreparationTime && (
                        <span className="badge-meta">
                          <Clock size={10} />
                          <span>~{item.estimatedPreparationTime}m</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="menu-item-price" style={{ fontSize: "15px", color: "#34d399", fontWeight: 700 }}>
                      {portionText}
                    </div>
                    {onSelectItem && (
                      <button
                        type="button"
                        className="menu-item-ask-btn"
                        onClick={() => {
                          onSelectItem(`Can I get ${item.name}?`);
                          onClose();
                        }}
                        style={{ marginTop: "6px" }}
                      >
                        <Sparkles size={11} />
                        <span>Ask assistant</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
