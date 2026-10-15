# 🍽️ CanteenCue ITER — AI College Canteen Food Decision Engine

> **Next-generation campus food decision assistant & live canteen catalog for ITER campus students.**
> Combines intelligent hybrid reasoning (Google Gemini Flash) with a high-performance offline deterministic decision engine, multi-outlet catalog filtering, and 7-day privacy-focused session history.

---

## ✨ Features

- **🎓 Campus Tailored Outlets (6 Live Outlets & 279 Dishes)**
  - *Anna's Restaurant & Catering*
  - *Mughlai Affair's*
  - *HALKA PHULKA*
  - *MAGGIE POINT*
  - *4TH FLOOR*
  - *Iter Juice Centre* (Juices, Shakes, Special Shakes, Fruit Salads & Lassi)
- **🧠 Hybrid AI & Deterministic Decision Engine**
  - **Online Cloud AI:** Powered by Google Gemini Flash with conversational memory and canteen menu grounding.
  - **Deterministic Engine:** Zero-downtime offline fallback adhering strictly to budget, dietary (Veg / Non-Veg / Egg), preparation time, craving, and student meal combos.
  - **Custom AI Keys:** Switch seamlessly between pre-configured system tier, custom Google Gemini keys, or OpenAI models.
- **⚡ Smart Recommendations & Combo Pairing**
  - Instant budget-efficient suggestions, pairing main dishes with refreshing beverages within student budgets.
  - Transparent trade-off explanations when strict criteria cannot be met without hallucinations.
- **🔐 Modern Auth & Session Management**
  - Google OAuth and Email magic link sign-in powered by Supabase.
  - Instagram-style "Welcome Back" / "Not you?" account switcher.
  - Automatic 7-day conversation lifecycle retention for single-account storage efficiency.
  - Clean modal navigation with mutually exclusive focus management and quick keyboard shortcuts (`Esc`).

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Lucide Icons
- **Styling:** Custom CSS Design Token System, Glassmorphic banquet aesthetic, fluid responsive layout
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime)
- **AI Models:** Google Gemini Flash API (`gemini-flash-latest`), OpenAI GPT API
- **Testing & Quality:** Vitest (36 unit & scenario tests), Oxlint (0 warnings / 0 errors), TypeScript strict check

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/adarsh0044321/canteencue-iter.git
cd canteencue-iter
npm install
```

### 2. Environment Setup
Copy the sample environment file and configure your credentials if desired (application will automatically use internal fallbacks if omitted):
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Run Test Suite & Linter
```bash
npm test        # Run vitest test suite
npm run lint    # Run oxlint protocol check
```

---

## 📄 License
MIT License. Built for ITER campus students.
