const fs = require('fs');
const path = require('path');

// Read existing menu.json to keep Anna's and Mughlai Affair's unchanged
const currentMenuPath = path.join(__dirname, '..', 'src', 'data', 'menu.json');
const currentMenu = JSON.parse(fs.readFileSync(currentMenuPath, 'utf8'));

// Filter only Anna's and Mughlai Affair's to avoid duplication if re-run
const existingItems = currentMenu.filter(i => 
  i.shop === "Anna's Restaurant & Catering" || i.shop === "Mughlai Affair's"
);

console.log(`Loaded ${existingItems.length} existing items from Anna's & Mughlai Affair's`);

// HALKA PHULKA ITEMS
const halkaPhulkaItems = [
  // DOSA
  { id: "hp_dosa_1", name: "Plain Dosa", category: "Dosa", price: 50, dietary: "vegetarian", tags: ["dosa", "south_indian", "crispy", "light"], spiceLevel: "mild", fillingLevel: "light", foodType: "dosa", estimatedPreparationTime: 8 },
  { id: "hp_dosa_2", name: "Plain Onion Dosa", category: "Dosa", price: 60, dietary: "vegetarian", tags: ["dosa", "onion", "south_indian"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 8 },
  { id: "hp_dosa_3", name: "Butter Onion Dosa", category: "Dosa", price: 70, dietary: "vegetarian", tags: ["dosa", "butter", "onion", "south_indian"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 8 },
  { id: "hp_dosa_4", name: "Masala Dosa", category: "Dosa", price: 60, dietary: "vegetarian", tags: ["dosa", "masala", "potato", "popular", "south_indian"], spiceLevel: "medium", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_5", name: "Onion Masala Dosa", category: "Dosa", price: 70, dietary: "vegetarian", tags: ["dosa", "onion", "masala"], spiceLevel: "medium", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_6", name: "Paneer Masala Dosa", category: "Dosa", price: 80, dietary: "vegetarian", tags: ["dosa", "paneer", "masala", "protein"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_7", name: "Butter Masala Dosa", category: "Dosa", price: 70, dietary: "vegetarian", tags: ["dosa", "butter", "masala"], spiceLevel: "medium", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_8", name: "Cheese Masala Dosa", category: "Dosa", price: 80, dietary: "vegetarian", tags: ["dosa", "cheese", "masala"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_9", name: "Butter Onion Masala Dosa", category: "Dosa", price: 80, dietary: "vegetarian", tags: ["dosa", "butter", "onion", "masala"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_10", name: "Cheese Onion Masala Dosa", category: "Dosa", price: 90, dietary: "vegetarian", tags: ["dosa", "cheese", "onion", "masala"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_11", name: "Butter Cheese Masala Dosa", category: "Dosa", price: 90, dietary: "vegetarian", tags: ["dosa", "butter", "cheese", "masala"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_12", name: "Onion Butter Cheese Masala Dosa", category: "Dosa", price: 100, dietary: "vegetarian", tags: ["dosa", "cheese", "butter", "special"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_dosa_13", name: "Spl Masala Dosa", category: "Dosa", price: 90, dietary: "vegetarian", tags: ["dosa", "special", "chef_special"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "dosa", estimatedPreparationTime: 12 },
  { id: "hp_dosa_14", name: "Butter paper Masala Dosa", category: "Dosa", price: 80, dietary: "vegetarian", tags: ["dosa", "butter", "paper_dosa", "crispy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },

  // UTTAPAM
  { id: "hp_utt_1", name: "Vegetable Uttapam", category: "Uttapam", price: 60, dietary: "vegetarian", tags: ["uttapam", "vegetable", "healthy", "south_indian"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_utt_2", name: "Onion Uttapam", category: "Uttapam", price: 50, dietary: "vegetarian", tags: ["uttapam", "onion"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_utt_3", name: "Tomato Uttapam", category: "Uttapam", price: 60, dietary: "vegetarian", tags: ["uttapam", "tomato"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },
  { id: "hp_utt_4", name: "Coconut Uttapam", category: "Uttapam", price: 60, dietary: "vegetarian", tags: ["uttapam", "coconut"], spiceLevel: "mild", fillingLevel: "medium", foodType: "dosa", estimatedPreparationTime: 10 },

  // BREAKFAST
  { id: "hp_bf_1", name: "Upama", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["upma", "breakfast", "quick", "light", "healthy"], spiceLevel: "mild", fillingLevel: "light", foodType: "breakfast", estimatedPreparationTime: 5 },
  { id: "hp_bf_2", name: "Idli", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["idli", "breakfast", "steamed", "healthy", "quick"], spiceLevel: "mild", fillingLevel: "light", foodType: "breakfast", estimatedPreparationTime: 4 },
  { id: "hp_bf_3", name: "Vada", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["vada", "crispy", "breakfast", "south_indian"], spiceLevel: "medium", fillingLevel: "medium", foodType: "breakfast", estimatedPreparationTime: 5 },
  { id: "hp_bf_4", name: "Aluchop", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["aluchop", "snack", "potato", "crispy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_bf_5", name: "Samosa", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["samosa", "snack", "crispy", "potato"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_bf_6", name: "Puri", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["puri", "breakfast", "puri_sabzi", "filling"], spiceLevel: "medium", fillingLevel: "medium", foodType: "breakfast", estimatedPreparationTime: 8 },
  { id: "hp_bf_7", name: "Aludum Dahiwada", category: "Breakfast", price: 40, dietary: "vegetarian", tags: ["dahiwada", "aloodum", "chaat", "street_food"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },

  // ROOTI SAVJI @ 60/-
  { id: "hp_rooti_1", name: "Rooti 2pc + Mixveg + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "mixveg", "thali", "filling", "healthy", "lunch"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_2", name: "Rooti 2pc + Paneer B.Masala + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "paneer", "butter_masala", "filling", "popular", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_3", name: "Rooti 2pc + Mashroom Masala + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "mushroom", "curry", "filling", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_4", name: "Rooti 2pc + Chili Paneer + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "chilli_paneer", "spicy", "filling", "lunch"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_5", name: "Rooti 2pc + Chili Mashroom + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "chilli_mushroom", "spicy", "filling", "lunch"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_6", name: "Rooti 2pc + Chana Masala + Dahi + Pickle", category: "Rooti Savji", price: 60, dietary: "vegetarian", tags: ["roti", "chana_masala", "protein", "filling", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 8 },
  { id: "hp_rooti_7", name: "Extra Rooti", category: "Rooti Savji", price: 10, dietary: "vegetarian", tags: ["extra", "roti", "bread"], spiceLevel: "mild", fillingLevel: "light", foodType: "bread", estimatedPreparationTime: 3 },

  // PARATHA SAVJI @ 70/-
  { id: "hp_par_sav_1", name: "Paratha 2pc + Mixveg + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "mixveg", "meal", "filling", "lunch"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_2", name: "Paratha 2pc + Paneer B.Masala + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "paneer", "butter_masala", "filling", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_3", name: "Paratha 2pc + Mashroom Masala + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "mushroom", "meal", "filling", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_4", name: "Paratha 2pc + Chili Paneer + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "chilli_paneer", "spicy", "filling", "lunch"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_5", name: "Paratha 2pc + Chili Mashroom + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "chilli_mushroom", "spicy", "filling", "lunch"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_6", name: "Paratha 2pc + Chana Masala + Dahi + Pickle", category: "Paratha Savji", price: 70, dietary: "vegetarian", tags: ["paratha", "chana_masala", "filling", "lunch"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_par_sav_7", name: "Extra Paratha", category: "Paratha Savji", price: 15, dietary: "vegetarian", tags: ["extra", "paratha", "bread"], spiceLevel: "mild", fillingLevel: "light", foodType: "bread", estimatedPreparationTime: 4 },

  // VADA PAV
  { id: "hp_vp_1", name: "Plain Vada Pav", category: "Vada Pav", price: 30, dietary: "vegetarian", tags: ["vada_pav", "mumbai", "snack", "budget", "street_food"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 4 },
  { id: "hp_vp_2", name: "Classic Vada Pav", category: "Vada Pav", price: 35, dietary: "vegetarian", tags: ["vada_pav", "classic", "snack", "budget"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 4 },
  { id: "hp_vp_3", name: "Butter Vada Pav", category: "Vada Pav", price: 40, dietary: "vegetarian", tags: ["vada_pav", "butter", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_vp_4", name: "Cheese Vada Pav", category: "Vada Pav", price: 50, dietary: "vegetarian", tags: ["vada_pav", "cheese", "snack"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_vp_5", name: "Schezwan Vada Pav", category: "Vada Pav", price: 45, dietary: "vegetarian", tags: ["vada_pav", "schezwan", "spicy"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },

  // CHHOLE BHATURE
  { id: "hp_cb_1", name: "Chhole Bhature", category: "Chhole Bhature", price: 60, dietary: "vegetarian", tags: ["chhole_bhature", "punjabi", "filling", "popular", "heavy"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "thali", estimatedPreparationTime: 10 },
  { id: "hp_cb_2", name: "Extra Chhole", category: "Chhole Bhature", price: 30, dietary: "vegetarian", tags: ["extra", "chhole"], spiceLevel: "medium", fillingLevel: "medium", foodType: "gravy", estimatedPreparationTime: 3 },
  { id: "hp_cb_3", name: "Extra Bhature", category: "Chhole Bhature", price: 20, dietary: "vegetarian", tags: ["extra", "bhature"], spiceLevel: "mild", fillingLevel: "medium", foodType: "bread", estimatedPreparationTime: 5 },

  // PARATHA & EXTRAS
  { id: "hp_par_1", name: "Alu Paratha", category: "Paratha", price: 50, dietary: "vegetarian", tags: ["paratha", "aloo", "breakfast", "filling"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "hp_par_2", name: "Paneer Paratha", category: "Paratha", price: 60, dietary: "vegetarian", tags: ["paratha", "paneer", "protein", "filling"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "hp_par_3", name: "Butter Alu Paratha", category: "Paratha", price: 60, dietary: "vegetarian", tags: ["paratha", "aloo", "butter"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "hp_par_4", name: "Butter Paneer Paratha", category: "Paratha", price: 70, dietary: "vegetarian", tags: ["paratha", "paneer", "butter"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "hp_par_5", name: "Spl Paneer Paratha", category: "Paratha", price: 80, dietary: "vegetarian", tags: ["paratha", "paneer", "special"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 12 },
  { id: "hp_par_6", name: "Crispy Paneer", category: "Paratha", price: 90, dietary: "vegetarian", tags: ["paneer", "starter", "crispy", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "hp_bev_1", name: "Masala Coldrinks", category: "Beverages", price: 30, dietary: "vegetarian", tags: ["beverage", "cold_drinks", "masala", "refreshing"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 2 },

  // CHAT
  { id: "hp_chat_1", name: "Papdi Chat", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "papdi", "tangy", "street_food"], spiceLevel: "medium", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_2", name: "Samosa Chat", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "samosa", "popular", "street_food"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_3", name: "Alu Tika Chat", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "aloo_tikki", "tangy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_4", name: "Cutlet Chat", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "cutlet"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_5", name: "Mix Masla Chat", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "masala"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_6", name: "Pani Puri", category: "Chat", price: 30, dietary: "vegetarian", tags: ["pani_puri", "golgappa", "puchka", "street_food", "tangy"], spiceLevel: "spicy", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 4 },
  { id: "hp_chat_7", name: "Dahi Gupchup", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "dahi", "gupchup", "cooling", "street_food"], spiceLevel: "mild", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_8", name: "Spl Masala Gupchup", category: "Chat", price: 40, dietary: "vegetarian", tags: ["chaat", "masala", "gupchup", "spicy"], spiceLevel: "spicy", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "hp_chat_9", name: "Khata Meetha Dahiwada", category: "Chat", price: 30, dietary: "vegetarian", tags: ["dahiwada", "sweet", "tangy", "cooling"], spiceLevel: "mild", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },

  // PAV BHAJI
  { id: "hp_pb_1", name: "Plain Pav Bhaji", category: "Pav Bhaji", price: 50, dietary: "vegetarian", tags: ["pav_bhaji", "butter", "mumbai", "popular"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "hp_pb_2", name: "Butter Pav Bhaji", category: "Pav Bhaji", price: 60, dietary: "vegetarian", tags: ["pav_bhaji", "extra_butter", "rich"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "hp_pb_3", name: "Cheese Pav Bhaji", category: "Pav Bhaji", price: 70, dietary: "vegetarian", tags: ["pav_bhaji", "cheese"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "hp_pb_4", name: "Cheese Butter Pav Bhaji", category: "Pav Bhaji", price: 80, dietary: "vegetarian", tags: ["pav_bhaji", "cheese", "butter", "filling"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "hp_pb_5", name: "Masala Pav Bhaji", category: "Pav Bhaji", price: 70, dietary: "vegetarian", tags: ["pav_bhaji", "masala", "spicy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "hp_pb_6", name: "Extra Pav", category: "Pav Bhaji", price: 20, dietary: "vegetarian", tags: ["extra", "pav"], spiceLevel: "mild", fillingLevel: "light", foodType: "bread", estimatedPreparationTime: 2 },
  { id: "hp_pb_7", name: "Extra Bhaji", category: "Pav Bhaji", price: 20, dietary: "vegetarian", tags: ["extra", "bhaji"], spiceLevel: "medium", fillingLevel: "light", foodType: "gravy", estimatedPreparationTime: 2 }
].map(i => ({ ...i, shop: "HALKA PHULKA", availability: true }));

// MAGGIE POINT ITEMS
const maggiePointItems = [
  // NOODLES
  { id: "mp_mg_1", name: "Original Masala Maggi", category: "Noodles", price: 55, dietary: "vegetarian", tags: ["maggi", "noodles", "classic", "comfort_food"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 6 },
  { id: "mp_mg_2", name: "Atta Masala Maggi", category: "Noodles", price: 60, dietary: "vegetarian", tags: ["maggi", "atta", "healthy", "noodles"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 6 },
  { id: "mp_mg_3", name: "Garden Fresh Maggi", category: "Noodles", price: 65, dietary: "vegetarian", tags: ["maggi", "vegetables", "fresh", "noodles"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_4", name: "Butter Garlic Maggi", category: "Noodles", price: 70, dietary: "vegetarian", tags: ["maggi", "butter", "garlic", "aromatic"], spiceLevel: "medium", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_5", name: "Chilli Garlic Maggi", category: "Noodles", price: 75, dietary: "vegetarian", tags: ["maggi", "chilli", "garlic", "spicy"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_6", name: "Periperi Maggi", category: "Noodles", price: 80, dietary: "vegetarian", tags: ["maggi", "peri_peri", "spicy", "zesty"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_7", name: "Barbeque Maggi", category: "Noodles", price: 80, dietary: "vegetarian", tags: ["maggi", "bbq", "smoky"], spiceLevel: "medium", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_8", name: "Shillong Szechuan Maggi", category: "Noodles", price: 80, dietary: "vegetarian", tags: ["maggi", "schezwan", "spicy", "northeast_flavor"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_9", name: "Hostel Wali Maggi", category: "Noodles", price: 80, dietary: "vegetarian", tags: ["maggi", "hostel", "nostalgic", "comfort_food"], spiceLevel: "medium", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 7 },
  { id: "mp_mg_10", name: "Italiano Maggi", category: "Noodles", price: 90, dietary: "vegetarian", tags: ["maggi", "herbs", "cheese", "italian"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_mg_11", name: "Kolkata Special Maggi", category: "Noodles", price: 90, dietary: "vegetarian", tags: ["maggi", "kolkata_special", "spicy", "mustard"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_mg_12", name: "Hyderabadi Maggi", category: "Noodles", price: 90, dietary: "vegetarian", tags: ["maggi", "hyderabadi", "spicy", "biryani_masala"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_mg_13", name: "Patiala Tandoori Maggi", category: "Noodles", price: 90, dietary: "vegetarian", tags: ["maggi", "tandoori", "punjabi", "smoky"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_mg_14", name: "Korean BBQ Noodles", category: "Noodles", price: 110, dietary: "vegetarian", tags: ["noodles", "korean", "bbq", "ramen_style", "trendy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "noodles", estimatedPreparationTime: 8 },

  // PAZZTA
  { id: "mp_paz_1", name: "Cheese Oregano Pazzta", category: "Pazzta", price: 80, dietary: "vegetarian", tags: ["pasta", "cheese", "oregano", "creamy"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_paz_2", name: "Tomato Pazzta", category: "Pazzta", price: 80, dietary: "vegetarian", tags: ["pasta", "tomato", "tangy", "red_sauce"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_paz_3", name: "Mushroom Pazzta", category: "Pazzta", price: 80, dietary: "vegetarian", tags: ["pasta", "mushroom", "creamy"], spiceLevel: "mild", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },
  { id: "mp_paz_4", name: "Masala-AE-Magic Pazzta", category: "Pazzta", price: 80, dietary: "vegetarian", tags: ["pasta", "masala_magic", "indian_fusion"], spiceLevel: "medium", fillingLevel: "medium", foodType: "noodles", estimatedPreparationTime: 8 },

  // RICE BOWL
  { id: "mp_rb_1", name: "WOK Rice", category: "Rice Bowl", price: 100, dietary: "vegetarian", tags: ["rice", "wok", "stir_fry", "filling"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "rice", estimatedPreparationTime: 10 },
  { id: "mp_rb_2", name: "Chilli Garlic Rice", category: "Rice Bowl", price: 100, dietary: "vegetarian", tags: ["rice", "chilli_garlic", "spicy", "filling"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "rice", estimatedPreparationTime: 10 },

  // SWEET CORN
  { id: "mp_sc_1", name: "Chilli Garlic Sweet Corn", category: "Sweet Corn", price: 80, dietary: "vegetarian", tags: ["sweet_corn", "healthy", "snack", "chilli_garlic"], spiceLevel: "spicy", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },
  { id: "mp_sc_2", name: "Masala-AE-Magic Sweet Corn", category: "Sweet Corn", price: 80, dietary: "vegetarian", tags: ["sweet_corn", "masala", "healthy", "snack"], spiceLevel: "medium", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 5 },

  // NESCAFE HOT BEVERAGES
  { id: "mp_bev_1", name: "Lemon Tea", category: "Hot Beverages", price: 25, dietary: "vegetarian", tags: ["tea", "lemon", "beverage", "budget", "refreshing"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 3 },
  { id: "mp_bev_2", name: "Black Tea", category: "Hot Beverages", price: 25, dietary: "vegetarian", tags: ["tea", "black_tea", "beverage", "light"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 3 },
  { id: "mp_bev_3", name: "Cardamom Tea", category: "Hot Beverages", price: 30, dietary: "vegetarian", tags: ["tea", "elaichi", "milk_tea", "beverage"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_bev_4", name: "Masala Tea", category: "Hot Beverages", price: 30, dietary: "vegetarian", tags: ["tea", "masala_chai", "beverage", "spiced"], spiceLevel: "medium", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_bev_5", name: "Espresso Black Coffee", category: "Hot Beverages", price: 30, dietary: "vegetarian", tags: ["coffee", "espresso", "black_coffee", "caffeine"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 3 },
  { id: "mp_bev_6", name: "Nescafe Regular Coffee", category: "Hot Beverages", price: 30, dietary: "vegetarian", tags: ["coffee", "nescafe", "hot_coffee", "beverage"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_bev_7", name: "Cappuccino", category: "Hot Beverages", price: 50, dietary: "vegetarian", tags: ["coffee", "cappuccino", "frothy", "beverage"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_8", name: "Café Latte", category: "Hot Beverages", price: 50, dietary: "vegetarian", tags: ["coffee", "latte", "smooth", "beverage"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_9", name: "Hot Chocolate", category: "Hot Beverages", price: 50, dietary: "vegetarian", tags: ["hot_chocolate", "sweet", "comfort_food", "beverage"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_10", name: "Café Mocha", category: "Hot Beverages", price: 60, dietary: "vegetarian", tags: ["coffee", "mocha", "chocolate_coffee"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_11", name: "Irish Cappuccino", category: "Hot Beverages", price: 60, dietary: "vegetarian", tags: ["coffee", "irish", "specialty"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_12", name: "Hazelnut Cappuccino", category: "Hot Beverages", price: 60, dietary: "vegetarian", tags: ["coffee", "hazelnut", "flavored"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_bev_13", name: "Caramel Cappuccino", category: "Hot Beverages", price: 60, dietary: "vegetarian", tags: ["coffee", "caramel", "sweet"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 5 },

  // HOT CUP SOUPS
  { id: "mp_soup_1", name: "Tomato Soup", category: "Soup", price: 80, dietary: "vegetarian", tags: ["soup", "tomato", "warm", "comfort_food"], spiceLevel: "mild", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 6 },
  { id: "mp_soup_2", name: "Manchow Soup", category: "Soup", price: 80, dietary: "vegetarian", tags: ["soup", "manchow", "crispy_noodles", "spicy"], spiceLevel: "spicy", fillingLevel: "light", foodType: "starter", estimatedPreparationTime: 6 },

  // BLENDED COLD BEVERAGES & MORE COOLERS
  { id: "mp_cbev_1", name: "Lemon Ice Tea", category: "Cold Beverages", price: 60, dietary: "vegetarian", tags: ["iced_tea", "lemon", "cold", "refreshing"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_cbev_2", name: "Masala Ice Tea", category: "Cold Beverages", price: 65, dietary: "vegetarian", tags: ["iced_tea", "masala", "chilled"], spiceLevel: "medium", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_cbev_3", name: "Peach Ice Tea", category: "Cold Beverages", price: 75, dietary: "vegetarian", tags: ["iced_tea", "peach", "fruity", "refreshing"], spiceLevel: "mild", fillingLevel: "light", foodType: "beverage", estimatedPreparationTime: 4 },
  { id: "mp_cbev_4", name: "Frappe Mocha", category: "Cold Beverages", price: 75, dietary: "vegetarian", tags: ["frappe", "mocha", "cold_coffee", "chocolate"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_5", name: "Cold Chocolate", category: "Cold Beverages", price: 75, dietary: "vegetarian", tags: ["cold_chocolate", "chocolate", "sweet", "beverage"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_6", name: "Café Frappe (Cold Coffee)", category: "Cold Beverages", price: 80, dietary: "vegetarian", tags: ["cold_coffee", "frappe", "popular", "chilled"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_7", name: "Irish Frappe", category: "Cold Beverages", price: 85, dietary: "vegetarian", tags: ["frappe", "irish", "chilled"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_8", name: "Caramel Frappe", category: "Cold Beverages", price: 85, dietary: "vegetarian", tags: ["frappe", "caramel", "sweet"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_9", name: "Hazelnut Frappe", category: "Cold Beverages", price: 85, dietary: "vegetarian", tags: ["frappe", "hazelnut", "chilled"], spiceLevel: "mild", fillingLevel: "medium", foodType: "beverage", estimatedPreparationTime: 5 },
  { id: "mp_cbev_10", name: "Kit Kat Frappe", category: "Cold Beverages", price: 100, dietary: "vegetarian", tags: ["frappe", "kitkat", "premium", "dessert_beverage"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "beverage", estimatedPreparationTime: 6 },
  { id: "mp_cbev_11", name: "Munch Nuts Frappe", category: "Cold Beverages", price: 100, dietary: "vegetarian", tags: ["frappe", "munch_nuts", "crunchy", "sweet"], spiceLevel: "mild", fillingLevel: "heavy", foodType: "beverage", estimatedPreparationTime: 6 }
].map(i => ({ ...i, shop: "MAGGIE POINT", availability: true }));

// 4TH FLOOR ITEMS
const fourthFloorItems = [
  // NON-VEG BURGERS
  { id: "ff_nvb_1", name: "Crispy Chicken Burger", category: "Non-Veg Burgers", price: 109, dietary: "non_vegetarian", tags: ["burger", "chicken", "crispy", "fast_food"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvb_2", name: "Tandoori Chicken Burger", category: "Non-Veg Burgers", price: 119, dietary: "non_vegetarian", tags: ["burger", "chicken", "tandoori", "spicy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvb_3", name: "Peri Peri Chicken Burger", category: "Non-Veg Burgers", price: 109, dietary: "non_vegetarian", tags: ["burger", "chicken", "peri_peri", "spicy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvb_4", name: "Bbq Grill Chicken Burger", category: "Non-Veg Burgers", price: 139, dietary: "non_vegetarian", tags: ["burger", "chicken", "bbq", "smoky"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 12 },
  { id: "ff_nvb_5", name: "Doubledown Burger", category: "Non-Veg Burgers", price: 169, dietary: "non_vegetarian", tags: ["burger", "double_patty", "heavy", "party", "filling"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 15 },

  // VEG BURGERS
  { id: "ff_vb_1", name: "Crispy Paneer Burger", category: "Veg Burgers", price: 119, dietary: "vegetarian", tags: ["burger", "paneer", "crispy", "vegetarian"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vb_2", name: "Veg Deluxe Burger", category: "Veg Burgers", price: 109, dietary: "vegetarian", tags: ["burger", "deluxe", "veggie"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "ff_vb_3", name: "Tandoori Paneer Burger", category: "Veg Burgers", price: 119, dietary: "vegetarian", tags: ["burger", "paneer", "tandoori", "spicy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vb_4", name: "Aloo Tikki Burger", category: "Veg Burgers", price: 89, dietary: "vegetarian", tags: ["burger", "aloo_tikki", "budget", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "ff_vb_5", name: "Crispy Mushroom Burger", category: "Veg Burgers", price: 99, dietary: "vegetarian", tags: ["burger", "mushroom", "crispy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "ff_vb_6", name: "Veg Finger Burger", category: "Veg Burgers", price: 89, dietary: "vegetarian", tags: ["burger", "veg_finger", "crispy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "ff_vb_7", name: "Farm Fresh Burger (Paneer With Mushroom)", category: "Veg Burgers", price: 109, dietary: "vegetarian", tags: ["burger", "farm_fresh", "paneer", "mushroom"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },

  // NON VEG WRAP UP
  { id: "ff_nvw_1", name: "Crispy Chicken Wrap", category: "Non-Veg Wraps", price: 119, dietary: "non_vegetarian", tags: ["wrap", "chicken", "crispy", "roll"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvw_2", name: "Peri Peri Chicken Wrap", category: "Non-Veg Wraps", price: 119, dietary: "non_vegetarian", tags: ["wrap", "chicken", "peri_peri", "spicy"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvw_3", name: "Tandoori Chicken Wrap", category: "Non-Veg Wraps", price: 129, dietary: "non_vegetarian", tags: ["wrap", "chicken", "tandoori"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },

  // VEG WRAP UP
  { id: "ff_vw_1", name: "Crispy Paneer Wrap", category: "Veg Wraps", price: 109, dietary: "vegetarian", tags: ["wrap", "paneer", "crispy", "vegetarian"], spiceLevel: "medium", fillingLevel: "medium", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vw_2", name: "Crispy Mushroom Wrap", category: "Veg Wraps", price: 99, dietary: "vegetarian", tags: ["wrap", "mushroom", "crispy"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "ff_vw_3", name: "Crispy Veg Wrap", category: "Veg Wraps", price: 99, dietary: "vegetarian", tags: ["wrap", "crispy", "veggie"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "ff_vw_4", name: "Aloo Tikki Wrap", category: "Veg Wraps", price: 99, dietary: "vegetarian", tags: ["wrap", "aloo_tikki", "budget"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "ff_vw_5", name: "Tandoori Paneer Wrap", category: "Veg Wraps", price: 119, dietary: "vegetarian", tags: ["wrap", "paneer", "tandoori"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vw_6", name: "Farm Fresh Wrap (Paneer With Mushroom)", category: "Veg Wraps", price: 119, dietary: "vegetarian", tags: ["wrap", "farm_fresh", "paneer", "mushroom"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },

  // NON-VEG LONGER
  { id: "ff_nvl_1", name: "Crispy Chicken Longer", category: "Non-Veg Longer", price: 129, dietary: "non_vegetarian", tags: ["longer", "sub", "chicken", "crispy"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvl_2", name: "Peri Peri Chicken Longer", category: "Non-Veg Longer", price: 129, dietary: "non_vegetarian", tags: ["longer", "sub", "chicken", "peri_peri"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_nvl_3", name: "Tandoori Chicken Longer", category: "Non-Veg Longer", price: 129, dietary: "non_vegetarian", tags: ["longer", "sub", "chicken", "tandoori"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },

  // VEG LONGER
  { id: "ff_vl_1", name: "Crispy Paneer Longer", category: "Veg Longer", price: 129, dietary: "vegetarian", tags: ["longer", "sub", "paneer", "crispy"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vl_2", name: "Veg Deluxe Chilli Cheese Longer", category: "Veg Longer", price: 139, dietary: "vegetarian", tags: ["longer", "sub", "cheese", "spicy"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },
  { id: "ff_vl_3", name: "Tandoori Paneer Longer", category: "Veg Longer", price: 129, dietary: "vegetarian", tags: ["longer", "sub", "paneer", "tandoori"], spiceLevel: "spicy", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 10 },
  { id: "ff_vl_4", name: "Farm Fresh Longer", category: "Veg Longer", price: 129, dietary: "vegetarian", tags: ["longer", "sub", "veggie", "farm_fresh"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "starter", estimatedPreparationTime: 10 },

  // NON-VEG SANDWICH
  { id: "ff_nvs_1", name: "Chicken Sandwich", category: "Non-Veg Sandwich", price: 79, dietary: "non_vegetarian", tags: ["sandwich", "chicken", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 8 },
  { id: "ff_nvs_2", name: "Chicken Cheese Sandwich", category: "Non-Veg Sandwich", price: 99, dietary: "non_vegetarian", tags: ["sandwich", "chicken", "cheese", "filling"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 8 },

  // VEG SANDWICH
  { id: "ff_vs_1", name: "Paneer Sandwich", category: "Veg Sandwich", price: 79, dietary: "vegetarian", tags: ["sandwich", "paneer", "vegetarian"], spiceLevel: "medium", fillingLevel: "medium", foodType: "paneer", estimatedPreparationTime: 8 },
  { id: "ff_vs_2", name: "Paneer Cheese Sandwich", category: "Veg Sandwich", price: 99, dietary: "vegetarian", tags: ["sandwich", "paneer", "cheese"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "paneer", estimatedPreparationTime: 8 },
  { id: "ff_vs_3", name: "Mushroom Sandwich", category: "Veg Sandwich", price: 79, dietary: "vegetarian", tags: ["sandwich", "mushroom"], spiceLevel: "medium", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },
  { id: "ff_vs_4", name: "Veg Corn Sandwich", category: "Veg Sandwich", price: 69, dietary: "vegetarian", tags: ["sandwich", "corn", "budget", "snack"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 },

  // HOT & CRISPY CHICKEN
  { id: "ff_hcc_1", name: "Chicken Wings Big Size (4pc)", category: "Hot & Crispy Chicken", price: 109, dietary: "non_vegetarian", tags: ["crispy_chicken", "wings", "chicken", "party"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 12 },
  { id: "ff_hcc_2", name: "Chicken Wings Small Size (5pc)", category: "Hot & Crispy Chicken", price: 99, dietary: "non_vegetarian", tags: ["crispy_chicken", "wings", "budget"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_hcc_3", name: "Boneless Strips (5pc)", category: "Hot & Crispy Chicken", price: 89, dietary: "non_vegetarian", tags: ["crispy_chicken", "strips", "boneless", "popular"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_hcc_4", name: "Chicken Popcorn (15pc)", category: "Hot & Crispy Chicken", price: 99, dietary: "non_vegetarian", tags: ["crispy_chicken", "popcorn", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 8 },
  { id: "ff_hcc_5", name: "Chicken Popcorn (25pc)", category: "Hot & Crispy Chicken", price: 159, dietary: "non_vegetarian", tags: ["crispy_chicken", "popcorn", "party", "sharing"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_hcc_6", name: "Drumstick (1pc)", category: "Hot & Crispy Chicken", price: 79, dietary: "non_vegetarian", tags: ["crispy_chicken", "drumstick", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "chicken", estimatedPreparationTime: 10 },
  { id: "ff_hcc_7", name: "Drumstick (2pc)", category: "Hot & Crispy Chicken", price: 140, dietary: "non_vegetarian", tags: ["crispy_chicken", "drumstick", "meal"], spiceLevel: "medium", fillingLevel: "heavy", foodType: "chicken", estimatedPreparationTime: 12 },

  // HOT & CRISPY VEG
  { id: "ff_hcv_1", name: "Crispy Paneer Strips (4pc)", category: "Hot & Crispy Veg", price: 99, dietary: "vegetarian", tags: ["crispy_veg", "paneer", "strips", "snack"], spiceLevel: "medium", fillingLevel: "medium", foodType: "paneer", estimatedPreparationTime: 8 },
  { id: "ff_hcv_2", name: "Potato Bites (15pc)", category: "Hot & Crispy Veg", price: 99, dietary: "vegetarian", tags: ["crispy_veg", "potato", "bites", "snack"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 7 },
  { id: "ff_hcv_3", name: "French Fries", category: "Hot & Crispy Veg", price: 79, dietary: "vegetarian", tags: ["fries", "crispy", "snack", "classic"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 6 },
  { id: "ff_hcv_4", name: "Peri Peri Fries", category: "Hot & Crispy Veg", price: 99, dietary: "vegetarian", tags: ["fries", "peri_peri", "spicy", "popular"], spiceLevel: "spicy", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 6 },
  { id: "ff_hcv_5", name: "Crispy Veggie Finger (4pc)", category: "Hot & Crispy Veg", price: 99, dietary: "vegetarian", tags: ["crispy_veg", "veggie_finger", "snack"], spiceLevel: "mild", fillingLevel: "medium", foodType: "starter", estimatedPreparationTime: 8 }
].map(i => ({ ...i, shop: "4TH FLOOR", availability: true }));

const allCombined = [
  ...existingItems,
  ...halkaPhulkaItems,
  ...maggiePointItems,
  ...fourthFloorItems
];

console.log(`Total combined menu items: ${allCombined.length}`);

// Write updated menu.json
fs.writeFileSync(currentMenuPath, JSON.stringify(allCombined, null, 2), 'utf8');
console.log(`Updated ${currentMenuPath}`);

// Generate SQL Script
const sqlFilePath = path.join(__dirname, '..', 'supabase', 'schema_and_menus.sql');

let sql = `-- ==============================================================================
-- CANTEEN CUE: SUPABASE DATABASE INITIALIZATION & MENU MIGRATION SCRIPT
-- ==============================================================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- It creates all required tables, indexes, row-level security (RLS), and seeds
-- 250+ real campus canteen items across 5 food outlets.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. OUTLETS TABLE
CREATE TABLE IF NOT EXISTS public.outlets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cuisine TEXT NOT NULL,
    description TEXT,
    operating_hours TEXT DEFAULT '8:00 AM - 10:00 PM',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Outlets
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on outlets" ON public.outlets
    FOR SELECT USING (true);

-- 3. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    outlet_id TEXT REFERENCES public.outlets(id) ON DELETE CASCADE,
    shop TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    portion_options JSONB,
    dietary TEXT NOT NULL CHECK (dietary IN ('vegetarian', 'non_vegetarian', 'contains_egg')),
    tags TEXT[] DEFAULT '{}',
    ingredients TEXT[] DEFAULT '{}',
    estimated_prep_time INTEGER DEFAULT 10,
    availability BOOLEAN DEFAULT true,
    spice_level TEXT CHECK (spice_level IN ('mild', 'medium', 'spicy')),
    filling_level TEXT CHECK (filling_level IN ('light', 'medium', 'heavy')),
    food_type TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.2,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Menu Items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on menu items" ON public.menu_items
    FOR SELECT USING (true);

-- 4. CHAT SESSIONS & CONVERSATION MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_name TEXT DEFAULT 'Student',
    session_name TEXT DEFAULT 'Campus Food Chat',
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on chat sessions" ON public.chat_sessions
    FOR ALL USING (true);

-- 5. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text TEXT,
    decision JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on chat messages" ON public.chat_messages
    FOR ALL USING (true);

-- 6. PRODUCT RATINGS & REVIEWS TABLE (Ready for ratings integration)
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read reviews" ON public.product_reviews
    FOR SELECT USING (true);
CREATE POLICY "Allow public write reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA: OUTLETS
-- ==============================================================================
INSERT INTO public.outlets (id, name, cuisine, description) VALUES
('outlet_annas', 'Anna''s Restaurant & Catering', 'South Indian, Thalis, Rolls & Biryani', 'Traditional campus favorite offering authentic dosas, combo thalis, and quick bites.'),
('outlet_mughlai', 'Mughlai Affair''s', 'Mughlai, North Indian, Kebabs & Gravies', 'Rich curries, fresh rotis, tandoor items, and flavorful biryanis.'),
('outlet_halka_phulka', 'HALKA PHULKA', 'South Indian, North Indian, Breakfast & Snacks', 'Dosas, Savji combos, Vada Pav, Pav Bhaji, and tangy street chats.'),
('outlet_maggie_point', 'MAGGIE POINT', 'Maggi, Pasta, Rice Bowls & Nescafé Beverages', 'Quick noodles in 14+ flavors, pasta, rice bowls, hot coffees, and thick cold frappes.'),
('outlet_fourth_floor', '4TH FLOOR', 'Burgers, Wraps, Longers, Sandwiches & Crispy Treats', 'American fast-food grill featuring crispy chicken wings, smash burgers, and loaded fries.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    cuisine = EXCLUDED.cuisine,
    description = EXCLUDED.description;

-- ==============================================================================
-- 8. SEED DATA: MENU ITEMS (250+ ITEMS)
-- ==============================================================================
`;

// Helper to escape SQL strings
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function getOutletId(shop) {
  if (shop === "Anna's Restaurant & Catering") return 'outlet_annas';
  if (shop === "Mughlai Affair's") return 'outlet_mughlai';
  if (shop === "HALKA PHULKA") return 'outlet_halka_phulka';
  if (shop === "MAGGIE POINT") return 'outlet_maggie_point';
  if (shop === "4TH FLOOR") return 'outlet_fourth_floor';
  return 'outlet_annas';
}

sql += 'INSERT INTO public.menu_items (\n  id, outlet_id, shop, name, category, price, portion_options, dietary, tags, estimated_prep_time, availability, spice_level, filling_level, food_type\n) VALUES\n';

const values = allCombined.map(item => {
  const oid = esc(getOutletId(item.shop));
  const id = esc(item.id);
  const shop = esc(item.shop);
  const name = esc(item.name);
  const cat = esc(item.category);
  const price = item.price;
  const portions = item.portionOptions ? esc(JSON.stringify(item.portionOptions)) + '::jsonb' : 'NULL';
  const dietary = esc(item.dietary);
  const tags = `ARRAY[${(item.tags || []).map(t => esc(t)).join(', ')}]::text[]`;
  const prep = item.estimatedPreparationTime || 10;
  const avail = item.availability !== false ? 'true' : 'false';
  const spice = esc(item.spiceLevel || 'medium');
  const filling = esc(item.fillingLevel || 'medium');
  const foodType = esc(item.foodType || 'starter');

  return `  (${id}, ${oid}, ${shop}, ${name}, ${cat}, ${price}, ${portions}, ${dietary}, ${tags}, ${prep}, ${avail}, ${spice}, ${filling}, ${foodType})`;
});

sql += values.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET\n' +
  '  name = EXCLUDED.name,\n' +
  '  price = EXCLUDED.price,\n' +
  '  category = EXCLUDED.category,\n' +
  '  dietary = EXCLUDED.dietary,\n' +
  '  tags = EXCLUDED.tags,\n' +
  '  spice_level = EXCLUDED.spice_level,\n' +
  '  filling_level = EXCLUDED.filling_level,\n' +
  '  food_type = EXCLUDED.food_type,\n' +
  '  availability = EXCLUDED.availability;\n';

fs.writeFileSync(sqlFilePath, sql, 'utf8');
console.log(`Wrote complete SQL schema & seed script to ${sqlFilePath}, total lines: ${sql.split('\n').length}`);
