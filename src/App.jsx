import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const STORAGE_KEY = "fo4-tracker-v2";

const STATS = [
  { id: "strength", name: "Strength", abbr: "STR" },
  { id: "perception", name: "Perception", abbr: "PER" },
  { id: "endurance", name: "Endurance", abbr: "END" },
  { id: "charisma", name: "Charisma", abbr: "CHA" },
  { id: "intelligence", name: "Intelligence", abbr: "INT" },
  { id: "agility", name: "Agility", abbr: "AGI" },
  { id: "luck", name: "Luck", abbr: "LCK" },
];

const STAT_BY_ID = Object.fromEntries(STATS.map((stat) => [stat.id, stat]));
const DEFAULT_SPECIAL = Object.fromEntries(STATS.map((stat) => [stat.id, 1]));
const DEFAULT_BOBBLEHEADS = Object.fromEntries(STATS.map((stat) => [stat.id, false]));

const DIFFICULTIES = ["Very Easy", "Easy", "Normal", "Hard", "Very Hard", "Survival"];

const MAGAZINE_CATEGORIES = [
  "Astoundingly Awesome Tales",
  "Grognak the Barbarian",
  "Guns and Bullets",
  "Live & Love",
  "Massachusetts Surgical Journal",
  "RobCo Fun",
  "Tales of a Junktown Jerky Vendor",
  "Tesla Science",
  "Tumblers Today",
  "U.S. Covert Operations Manual",
  "Unstoppables",
  "Wasteland Survival Guide",
];

const DEFAULT_MAGAZINES = Object.fromEntries(MAGAZINE_CATEGORIES.map((name) => [name, 0]));

const LEVEL_FOCUS = [
  "Not sure yet",
  "More damage",
  "Stay alive",
  "Sneak better",
  "Craft better gear",
  "Hack or pick locks",
  "Carry and supplies",
  "Power armor",
  "V.A.T.S. and criticals",
  "Settlements and caps",
];

const QUICK_PROMPTS = [
  "I leveled up. What should I consider?",
  "I want better hacking without spoilers.",
  "I keep dying on this difficulty.",
  "I use combat rifles and sneak sometimes.",
  "Should I save this perk point?",
];

const PERK_GROUPS = {
  strength: [
    ["Iron Fist", [1, 9, 18, 31, 46], ["damage", "melee", "unarmed"], "Improves unarmed damage when that is part of the build."],
    ["Big Leagues", [1, 7, 15, 27, 42], ["damage", "melee"], "Improves melee weapon damage and keeps close-range builds scaling."],
    ["Armorer", [1, 13, 25, 39], ["crafting", "defense", "powerArmor", "survival"], "Unlocks better armor workbench upgrades, useful on harder settings."],
    ["Blacksmith", [1, 16, 29], ["crafting", "melee"], "Unlocks stronger melee weapon mods."],
    ["Heavy Gunner", [1, 11, 21, 35, 47], ["damage", "heavy", "powerArmor"], "Improves heavy weapon damage."],
    ["Strong Back", [1, 10, 20, 30], ["carry", "survival", "quality"], "Adds carry capacity and reduces supply friction."],
    ["Steady Aim", [1, 28], ["guns", "automatic", "heavy"], "Helps hip-fire weapons feel steadier."],
    ["Basher", [1, 5, 14, 26], ["melee", "guns"], "Improves gun bashing; niche unless you already fight that way."],
    ["Rooted", [1, 22, 43], ["melee", "defense"], "Rewards standing your ground in close combat."],
    ["Pain Train", [1, 24, 50], ["powerArmor", "melee"], "Only matters if power armor is a regular part of the build."],
  ],
  perception: [
    ["Pickpocket", [1, 6, 17, 30], ["utility", "stealth"], "Supports a stealth utility playstyle."],
    ["Rifleman", [1, 9, 18, 31, 46], ["damage", "rifle", "semiAuto", "guns"], "Boosts non-automatic rifles, including combat rifle setups."],
    ["Awareness", [1], ["utility", "vats"], "Gives more combat readout information; useful but not usually urgent."],
    ["Locksmith", [1, 7, 18, 41], ["lockpicking", "utility"], "Opens more locked containers and doors without naming where they are."],
    ["Demolition Expert", [1, 10, 22, 34], ["damage", "explosives"], "Improves explosive damage and handling."],
    ["Night Person", [1, 25, 37], ["utility", "stealth"], "Adds time-of-day stat benefits; build-dependent."],
    ["Refractor", [1, 11, 21, 35, 42], ["defense", "energy"], "Adds energy resistance when that damage type is a problem."],
    ["Sniper", [1, 13, 26], ["rifle", "stealth", "vats"], "Supports scoped rifle play and precision shots."],
    ["Penetrator", [1, 28], ["vats", "rifle"], "Improves V.A.T.S. target flexibility."],
    ["Concentrated Fire", [1, 26, 50], ["vats", "damage"], "Makes repeated V.A.T.S. targeting more reliable."],
  ],
  endurance: [
    ["Toughness", [1, 9, 18, 31, 46], ["defense", "survival"], "Adds flat damage resistance, a simple durability pick."],
    ["Lead Belly", [1, 6, 17], ["survival", "quality"], "Makes food and drink less punishing."],
    ["Lifegiver", [1, 8, 20], ["defense", "health", "survival"], "Adds health, which is broadly useful on higher difficulties."],
    ["Chem Resistant", [1, 22], ["chems", "survival"], "Helps if chems are part of your combat plan."],
    ["Aquaboy/Aquagirl", [1, 21], ["quality", "survival"], "Useful quality-of-life protection in specific traversal situations."],
    ["Rad Resistant", [1, 13, 26, 35], ["defense", "radiation", "survival"], "Adds radiation resistance."],
    ["Adamantium Skeleton", [1, 13, 26], ["defense", "survival"], "Reduces limb damage, helpful when fights often go long."],
    ["Cannibal", [1, 19, 38], ["survival", "roleplay"], "A niche sustain choice if it matches how you want to play."],
    ["Ghoulish", [1, 24, 48, 50], ["radiation", "survival"], "Turns radiation exposure into more of a resource."],
    ["Solar Powered", [1, 27, 50], ["defense", "health"], "Strong stat and healing benefits if you fight outdoors often."],
  ],
  charisma: [
    ["Cap Collector", [1, 20, 41], ["caps", "settlements", "quality"], "Improves buying and selling value."],
    ["Lady Killer / Black Widow", [1, 7, 22], ["dialogue", "damage"], "A situational damage and dialogue perk."],
    ["Lone Wanderer", [1, 17, 40, 50], ["solo", "carry", "defense", "survival"], "Very strong if you usually travel without a companion."],
    ["Attack Dog", [1, 9, 25], ["companion", "defense"], "Only matters if that specific companion style is active."],
    ["Animal Friend", [1, 12, 28], ["utility"], "A niche non-spoiler utility pick."],
    ["Local Leader", [1, 14], ["settlements", "crafting", "quality"], "Supports settlement supply lines and crafting infrastructure."],
    ["Party Boy / Party Girl", [1, 15, 37], ["chems", "quality"], "Supports alcohol-based bonuses."],
    ["Inspirational", [1, 19, 43], ["companion", "defense"], "Best if you keep a companion with you."],
    ["Wasteland Whisperer", [1, 21, 49], ["utility"], "A niche control perk."],
    ["Intimidation", [1, 23, 50], ["utility"], "A niche control perk."],
  ],
  intelligence: [
    ["V.A.N.S.", [1], ["utility"], "Navigation utility; rarely the strongest build pick."],
    ["Medic", [1, 18, 30, 49], ["medicine", "defense", "survival"], "Makes healing items stronger, especially valuable on hard settings."],
    ["Gun Nut", [1, 13, 25, 39], ["crafting", "guns", "rifle", "pistol", "automatic"], "Unlocks better gun mods for most firearm builds."],
    ["Hacker", [1, 9, 21, 33], ["hacking", "utility"], "Unlocks higher terminal access without saying where to find it."],
    ["Scrapper", [1, 23], ["crafting", "quality"], "Improves materials gained from scrapping gear."],
    ["Science!", [1, 17, 28, 41], ["crafting", "energy", "powerArmor"], "Unlocks energy and advanced equipment mods."],
    ["Chemist", [1, 16, 32, 45], ["chems", "survival"], "Extends chem duration for chem-focused combat."],
    ["Robotics Expert", [1, 19, 44], ["utility"], "A niche technical control perk."],
    ["Nuclear Physicist", [1, 14, 26], ["powerArmor", "energy"], "Improves fusion core efficiency and radiation weapon damage."],
    ["Nerd Rage!", [1, 31, 50], ["defense", "damage", "survival"], "Emergency power when your health gets low."],
  ],
  agility: [
    ["Gunslinger", [1, 7, 15, 27, 42], ["damage", "pistol", "guns"], "Boosts non-automatic pistols."],
    ["Commando", [1, 11, 21, 35, 49], ["damage", "automatic", "guns"], "Boosts automatic weapons."],
    ["Sneak", [1, 5, 12, 23, 38], ["stealth", "survival"], "Makes stealth more reliable and helps avoid bad fights."],
    ["Mister Sandman", [1, 17, 30], ["stealth", "damage"], "Improves silenced weapon sneak attacks."],
    ["Action Boy / Action Girl", [1, 18, 38], ["vats", "mobility", "survival"], "Regenerates action points faster."],
    ["Moving Target", [1, 24, 44], ["defense", "mobility"], "Improves defense while sprinting."],
    ["Ninja", [1, 16, 33], ["stealth", "damage", "melee"], "Boosts sneak attack damage."],
    ["Quick Hands", [1, 28], ["guns", "quality"], "Improves reload flow for gun builds."],
    ["Blitz", [1, 29], ["melee", "vats"], "Makes V.A.T.S. melee engagement much easier."],
    ["Gun Fu", [1, 26, 50], ["vats", "damage", "guns"], "Rewards chaining V.A.T.S. shots between targets."],
  ],
  luck: [
    ["Fortune Finder", [1, 5, 25, 40], ["caps", "quality"], "Adds more caps over time."],
    ["Scrounger", [1, 7, 24, 37], ["ammo", "quality", "survival"], "Adds ammo supply, especially good for automatic weapons."],
    ["Bloody Mess", [1, 9, 31, 47], ["damage"], "A broad damage increase that works with any weapon type."],
    ["Mysterious Stranger", [1, 22, 41], ["vats", "damage"], "Adds occasional V.A.T.S. help."],
    ["Idiot Savant", [1, 11, 34], ["leveling", "quality"], "Improves XP bursts, most relevant with low Intelligence."],
    ["Better Criticals", [1, 15, 40], ["vats", "crit", "damage"], "Makes critical hits hit harder."],
    ["Critical Banker", [1, 17, 43], ["vats", "crit"], "Lets V.A.T.S. critical builds save critical hits."],
    ["Grim Reaper's Sprint", [1, 19, 46], ["vats", "crit"], "Can refill action points in V.A.T.S."],
    ["Four Leaf Clover", [1, 13, 32, 48], ["vats", "crit"], "Builds critical meter faster in V.A.T.S."],
    ["Ricochet", [1, 29, 50], ["defense", "survival"], "A late defensive luck perk."],
  ],
};

const ALL_PERKS = STATS.flatMap((stat) =>
  PERK_GROUPS[stat.id].map(([name, levels, tags, summary], index) => ({
    name,
    levels,
    tags,
    summary,
    stat: stat.id,
    specialReq: index + 1,
  })),
);

function createProfile() {
  return {
    level: 1,
    unspentPoints: 0,
    autoTrackPoints: true,
    strictPerkGates: true,
    difficulty: "Normal",
    special: { ...DEFAULT_SPECIAL },
    bobbleheads: { ...DEFAULT_BOBBLEHEADS },
    specialBookStat: "",
    perks: {},
    gearBonuses: "",
    playstyleNotes: "",
    powerArmor: false,
    companion: "",
    magazines: { ...DEFAULT_MAGAZINES },
  };
}

function loadInitialProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : createProfile();
  } catch {
    return createProfile();
  }
}

function normalizeProfile(profile) {
  const base = createProfile();
  const next = { ...base, ...(profile || {}) };

  next.level = clampNumber(next.level, 1, 300);
  next.unspentPoints = clampNumber(next.unspentPoints, 0, 999);
  next.autoTrackPoints = next.autoTrackPoints !== false;
  next.strictPerkGates = next.strictPerkGates !== false;
  next.difficulty = DIFFICULTIES.includes(next.difficulty) ? next.difficulty : "Normal";
  next.special = Object.fromEntries(
    STATS.map((stat) => [stat.id, clampNumber(next.special?.[stat.id] ?? 1, 1, 10)]),
  );
  next.bobbleheads = Object.fromEntries(
    STATS.map((stat) => [stat.id, Boolean(next.bobbleheads?.[stat.id])]),
  );
  next.specialBookStat = STATS.some((stat) => stat.id === next.specialBookStat) ? next.specialBookStat : "";
  next.perks = typeof next.perks === "object" && next.perks ? next.perks : {};
  next.gearBonuses = String(next.gearBonuses || "");
  next.playstyleNotes = String(next.playstyleNotes || "");
  next.companion = String(next.companion || "");
  next.powerArmor = Boolean(next.powerArmor);
  next.magazines = Object.fromEntries(
    MAGAZINE_CATEGORIES.map((name) => [name, clampNumber(next.magazines?.[name] ?? 0, 0, 999)]),
  );

  return next;
}

function clampNumber(value, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function parseGearBonuses(text) {
  const bonuses = Object.fromEntries(STATS.map((stat) => [stat.id, 0]));
  const clean = String(text || "");

  STATS.forEach((stat) => {
    const aliases = [stat.abbr, stat.name].map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const afterAmount = new RegExp(`([+-]\\s*\\d+)\\s*(?:${aliases})\\b`, "gi");
    const beforeAmount = new RegExp(`\\b(?:${aliases})\\s*([+-]\\s*\\d+)`, "gi");

    for (const match of clean.matchAll(afterAmount)) {
      bonuses[stat.id] += Number.parseInt(match[1].replace(/\s/g, ""), 10);
    }
    for (const match of clean.matchAll(beforeAmount)) {
      bonuses[stat.id] += Number.parseInt(match[1].replace(/\s/g, ""), 10);
    }
  });

  return bonuses;
}

function getEffectiveSpecial(profile) {
  const gear = parseGearBonuses(profile.gearBonuses);
  return Object.fromEntries(
    STATS.map((stat) => {
      const base = profile.special[stat.id] || 1;
      const bobblehead = profile.bobbleheads[stat.id] ? 1 : 0;
      const book = profile.specialBookStat === stat.id ? 1 : 0;
      return [stat.id, Math.max(1, base + bobblehead + book + gear[stat.id])];
    }),
  );
}

function formatSpecial(effective) {
  return STATS.map((stat) => `${stat.abbr} ${effective[stat.id]}`).join(" / ");
}

function getEarnedPerkPoints(profile) {
  return Math.max(0, profile.level - 1);
}

function getSpentPerkRanks(profile) {
  return Object.values(profile.perks).reduce((total, rank) => total + clampNumber(rank, 0, 99), 0);
}

// Level 1 starts with 28 SPECIAL points to distribute (7 stats x 1 = 7 base, +21 to assign = 28 total).
// Any base SPECIAL above 28 came from perk points spent on stats instead of perks.
const STARTING_SPECIAL_TOTAL = 28;

function getStatPointsSpent(profile) {
  const baseTotal = STATS.reduce((sum, stat) => sum + clampNumber(profile.special[stat.id] || 1, 1, 10), 0);
  return Math.max(0, baseTotal - STARTING_SPECIAL_TOTAL);
}

function getActualUnspentPoints(profile) {
  if (!profile.autoTrackPoints) return profile.unspentPoints;
  const earned = getEarnedPerkPoints(profile);
  const spentOnPerks = getSpentPerkRanks(profile);
  const spentOnStats = getStatPointsSpent(profile);
  return Math.max(0, earned - spentOnPerks - spentOnStats);
}

function getPerkItems(profile, effective) {
  return ALL_PERKS.map((perk) => {
    const currentRank = clampNumber(profile.perks[perk.name] || 0, 0, perk.levels.length);
    const nextRank = currentRank + 1;
    const maxed = nextRank > perk.levels.length;
    const levelReq = maxed ? null : perk.levels[nextRank - 1];
    const statValue = effective[perk.stat];
    const hasLevel = maxed || profile.level >= levelReq;
    const hasSpecial = statValue >= perk.specialReq;

    return {
      perk,
      currentRank,
      nextRank,
      maxed,
      levelReq,
      statValue,
      hasLevel,
      hasSpecial,
      available: !maxed && hasLevel && hasSpecial,
    };
  });
}

function buildTagWeights(profile, prompt, focus, concern) {
  const text = `${profile.playstyleNotes} ${profile.gearBonuses} ${prompt} ${focus} ${concern}`.toLowerCase();
  const weights = {};

  const add = (tags, amount) => {
    tags.forEach((tag) => {
      weights[tag] = (weights[tag] || 0) + amount;
    });
  };

  const hasAny = (words) => words.some((word) => text.includes(word));

  if (hasAny(["rifle", "combat rifle", "sniper", "semi auto", "semi-auto"])) add(["rifle", "semiAuto", "guns"], 16);
  if (hasAny(["automatic", "auto weapon", "commando", "spray"])) add(["automatic", "guns", "ammo"], 16);
  if (hasAny(["pistol", "handgun", "revolver"])) add(["pistol", "guns"], 16);
  if (hasAny(["melee", "bat", "blade", "close range"])) add(["melee", "damage", "defense"], 16);
  if (hasAny(["unarmed", "fist"])) add(["unarmed", "melee"], 16);
  if (hasAny(["heavy", "minigun", "launcher"])) add(["heavy", "powerArmor"], 16);
  if (hasAny(["sneak", "stealth", "silencer", "suppressed"])) add(["stealth", "rifle"], 18);
  if (hasAny(["vats", "v.a.t.s", "critical", "crit"])) add(["vats", "crit"], 18);
  if (hasAny(["craft", "mod", "upgrade", "armor", "weapon bench", "workbench"])) add(["crafting"], 18);
  if (hasAny(["hack", "terminal"])) add(["hacking"], 22);
  if (hasAny(["lock", "pick"])) add(["lockpicking"], 22);
  if (hasAny(["settlement", "supply", "shop", "caps", "money", "barter"])) add(["settlements", "caps"], 16);
  if (hasAny(["carry", "weight", "overencumbered", "over encumbered", "junk"])) add(["carry", "quality"], 16);
  if (hasAny(["die", "dying", "survive", "health", "damage hurts", "tough", "hard fight"])) {
    add(["defense", "health", "medicine", "survival"], 18);
  }
  if (hasAny(["chem", "psycho", "jet", "buffout"])) add(["chems"], 16);
  if (hasAny(["energy", "laser", "plasma", "fusion"])) add(["energy", "science", "powerArmor"], 12);
  if (hasAny(["explosive", "grenade", "mine", "missile"])) add(["explosives"], 18);
  if (hasAny(["ammo", "bullets", "rounds"])) add(["ammo"], 16);

  if (!profile.playstyleNotes.trim() && !prompt.trim() && !concern.trim() && focus === "Not sure yet") {
    add(["defense", "damage", "crafting"], 4);
  }

  switch (focus) {
    case "More damage":
      add(["damage", "guns", "melee"], 12);
      break;
    case "Stay alive":
      add(["defense", "health", "medicine", "survival"], 14);
      break;
    case "Sneak better":
      add(["stealth"], 18);
      break;
    case "Craft better gear":
      add(["crafting"], 18);
      break;
    case "Hack or pick locks":
      add(["hacking", "lockpicking"], 18);
      break;
    case "Carry and supplies":
      add(["carry", "ammo", "quality"], 18);
      break;
    case "Power armor":
      add(["powerArmor", "crafting", "energy"], 18);
      break;
    case "V.A.T.S. and criticals":
      add(["vats", "crit"], 18);
      break;
    case "Settlements and caps":
      add(["settlements", "caps"], 18);
      break;
    default:
      break;
  }

  if (profile.difficulty === "Survival") add(["survival", "defense", "health", "medicine", "carry", "stealth"], 12);
  if (profile.difficulty === "Very Hard" || profile.difficulty === "Hard") add(["damage", "defense", "crafting"], 8);
  if (profile.difficulty === "Very Easy" || profile.difficulty === "Easy") add(["quality", "crafting"], 5);

  if (profile.powerArmor) add(["powerArmor", "crafting", "energy", "defense"], 14);

  if (profile.companion.trim()) {
    add(["companion"], 10);
  } else {
    add(["solo"], 10);
  }

  if (profile.magazines["Grognak the Barbarian"] > 0) add(["melee"], 3);
  if (profile.magazines["Guns and Bullets"] > 0) add(["guns", "rifle", "pistol", "automatic"], 3);
  if (profile.magazines["Tesla Science"] > 0) add(["energy", "crafting"], 3);
  if (profile.magazines["Tumblers Today"] > 0) add(["lockpicking"], 3);
  if (profile.magazines["U.S. Covert Operations Manual"] > 0) add(["stealth"], 3);
  if (profile.magazines["Massachusetts Surgical Journal"] > 0) add(["medicine"], 3);
  if (profile.magazines["Tales of a Junktown Jerky Vendor"] > 0) add(["caps"], 3);
  if (profile.magazines["Wasteland Survival Guide"] > 0) add(["survival", "quality"], 3);

  return weights;
}

function scorePerk(item, weights, profile) {
  if (item.maxed || !item.available) return -999;

  const tagScore = item.perk.tags.reduce((total, tag) => total + (weights[tag] || 0), 0);
  let score = 10 + tagScore;

  if (item.currentRank > 0) score += 6;
  if (item.nextRank === 1) score += 2;
  if (item.perk.name === "Lone Wanderer" && profile.companion.trim()) score -= 18;
  if (item.perk.name === "Inspirational" && !profile.companion.trim()) score -= 10;
  if (item.perk.name === "Attack Dog" && !profile.companion.toLowerCase().includes("dog")) score -= 8;
  if (item.perk.name === "Pain Train" && !profile.powerArmor) score -= 20;
  if (item.perk.name === "Nuclear Physicist" && !profile.powerArmor && !item.perk.tags.includes("energy")) score -= 8;
  if (profile.difficulty === "Survival" && ["Fortune Finder", "V.A.N.S.", "Awareness"].includes(item.perk.name)) score -= 6;

  return score;
}

function getMatchedReason(item, weights, profile) {
  const matchedTags = item.perk.tags.filter((tag) => weights[tag] > 0);
  const reasons = [item.perk.summary];

  if (item.currentRank > 0) reasons.push("It continues a perk you already invested in.");
  if (matchedTags.includes("survival") && profile.difficulty === "Survival") {
    reasons.push("Survival makes sustain, carry weight, and avoiding bad fights more valuable.");
  }
  if (matchedTags.includes("hacking")) reasons.push("This directly answers the hacking need without naming any terminals.");
  if (matchedTags.includes("lockpicking")) reasons.push("This directly answers lock access without naming any locked content.");
  if (matchedTags.includes("powerArmor") && profile.powerArmor) reasons.push("You marked power armor as part of the build.");
  if (matchedTags.includes("companion") && profile.companion.trim()) reasons.push("You have a companion in use.");
  if (matchedTags.includes("solo") && !profile.companion.trim()) reasons.push("You are not tracking a companion right now.");

  return reasons.slice(0, 2).join(" ");
}

function getMissingRequirements(item) {
  const stat = STAT_BY_ID[item.perk.stat];
  const missing = [];

  if (!item.hasSpecial) missing.push(`${stat.abbr} ${item.perk.specialReq}`);
  if (!item.hasLevel) missing.push(`Level ${item.levelReq}`);

  return missing;
}

function getRankButtonState(item, rank, profile) {
  const currentRank = item.currentRank;

  if (rank <= currentRank) {
    return { enabled: true, label: `Rank ${rank}. Click to lower to ${rank - 1}.` };
  }

  if (!profile.strictPerkGates) {
    return { enabled: true, label: `Manual entry: set Rank ${rank}.` };
  }

  if (rank !== currentRank + 1) {
    return { enabled: false, label: "Take the previous rank first." };
  }

  const levelReq = item.perk.levels[rank - 1];
  const stat = STAT_BY_ID[item.perk.stat];
  const hasLevel = profile.level >= levelReq;
  const hasSpecial = item.statValue >= item.perk.specialReq;

  if (!hasSpecial) {
    return { enabled: false, label: `Needs ${stat.abbr} ${item.perk.specialReq}. You have ${item.statValue}.` };
  }

  if (!hasLevel) {
    return { enabled: false, label: `Needs Level ${levelReq}. You are Level ${profile.level}.` };
  }

  if (profile.autoTrackPoints && getActualUnspentPoints(profile) < 1) {
    return { enabled: false, label: "No unspent perk point tracked." };
  }

  return { enabled: true, label: `Take Rank ${rank}.` };
}

function getPerkGate(item, profile) {
  if (item.maxed) return { label: "MAX", className: "gate" };

  const missing = getMissingRequirements(item);
  if (missing.length) return { label: "LOCKED", className: "gate locked", title: `Needs ${missing.join(" and ")}` };
  if (profile.strictPerkGates && profile.autoTrackPoints && getActualUnspentPoints(profile) < 1) {
    return { label: "NO PTS", className: "gate locked", title: "No unspent perk point tracked." };
  }

  return { label: "READY", className: "gate", title: `Rank ${item.nextRank} is available.` };
}

function getPerkNextLine(item, profile) {
  const stat = STAT_BY_ID[item.perk.stat];

  if (item.maxed) return `Rank ${item.currentRank}/${item.perk.levels.length} - maxed`;

  const missing = getMissingRequirements(item);
  if (missing.length) {
    return `Rank ${item.currentRank}/${item.perk.levels.length} - next needs ${missing.join(" and ")}`;
  }

  if (profile.strictPerkGates && profile.autoTrackPoints && getActualUnspentPoints(profile) < 1) {
    return `Rank ${item.currentRank}/${item.perk.levels.length} - next ready, no unspent point`;
  }

  return `Rank ${item.currentRank}/${item.perk.levels.length} - next Rank ${item.nextRank}, ${stat.abbr} ${item.perk.specialReq}, Level ${item.levelReq}`;
}

function describeAdvisorContext(profile, prompt, focus, concern, weights) {
  const tags = Object.entries(weights)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  const parts = [];

  if (focus !== "Not sure yet") parts.push(focus.toLowerCase());
  if (prompt.trim() || concern.trim()) parts.push("your question");
  if (profile.playstyleNotes.trim()) parts.push("your loadout notes");
  if (profile.difficulty === "Survival" || profile.difficulty === "Very Hard") parts.push(`${profile.difficulty} difficulty`);
  if (profile.powerArmor) parts.push("power armor");
  if (profile.companion.trim()) parts.push(`companion: ${profile.companion.trim()}`);
  if (tags.length) parts.push(`signals: ${tags.join(", ")}`);

  return parts.length ? parts.join("; ") : "not enough build context yet";
}

function findBlockedRelevant(items, weights, promptText) {
  const normalizedPrompt = promptText.toLowerCase();

  return items
    .filter((item) => {
      if (item.available || item.maxed) return false;
      const tagScore = item.perk.tags.reduce((total, tag) => total + (weights[tag] || 0), 0);
      const nameHit = normalizedPrompt && item.perk.name.toLowerCase().includes(normalizedPrompt);
      return tagScore >= 18 || nameHit;
    })
    .sort((a, b) => {
      const aScore = a.perk.tags.reduce((total, tag) => total + (weights[tag] || 0), 0);
      const bScore = b.perk.tags.reduce((total, tag) => total + (weights[tag] || 0), 0);
      return bScore - aScore;
    })
    .slice(0, 3);
}

function parseAIRecommendations(text) {
  const match = text.match(/===FO4_RECOMMENDATIONS===([\s\S]*?)===END===/);
  if (!match) return null;

  const lines = match[1].trim().split('\n').filter(line => line.trim());
  const recommendations = [];

  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      const perkName = parts[0];
      const rankStr = parts[1];
      const reason = parts[2] || '';

      let targetRank = 0;
      if (rankStr.includes('Rank')) {
        targetRank = parseInt(rankStr.match(/\d+/)?.[0] || '0') || 0;
      } else if (rankStr.startsWith('+')) {
        targetRank = parseInt(rankStr) || 0;
      }

      if (perkName && targetRank > 0) {
        recommendations.push({ name: perkName, rank: targetRank, reason });
      }
    }
  }

  return recommendations.length > 0 ? recommendations : null;
}

function buildAdvisorReply(profile, { mode, prompt = "", focus = "Not sure yet", concern = "" }) {
  const effective = getEffectiveSpecial(profile);
  const items = getPerkItems(profile, effective);
  const weights = buildTagWeights(profile, prompt, focus, concern);
  const wantsToSave = /\b(save|bank|hold)\b/i.test(`${prompt} ${concern}`);
  const earnedPoints = getEarnedPerkPoints(profile);
  const spentRanks = getSpentPerkRanks(profile);
  const scored = items
    .map((item) => ({ ...item, score: scorePerk(item, weights, profile) }))
    .filter((item) => item.score > -100)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const blocked = findBlockedRelevant(items, weights, `${prompt} ${concern}`);
  const lines = [];

  if (mode === "levelup") {
    const missingContext = !profile.playstyleNotes.trim() && !concern.trim() && focus === "Not sure yet";
    if (missingContext) {
      lines.push("Before spending, answer this first: what weapon or problem defined the last level? With no extra context, this is a conservative read.");
      lines.push("");
    }
  }

  lines.push(`My read: ${describeAdvisorContext(profile, prompt, focus, concern, weights)}.`);
  lines.push(`Build gates: Level ${profile.level}; effective S.P.E.C.I.A.L. ${formatSpecial(effective)}; earned level-up points ${earnedPoints}; tracked perk ranks ${spentRanks}; unspent points ${profile.unspentPoints}.`);
  if (profile.autoTrackPoints && profile.unspentPoints === 0) {
    lines.push("Planning note: you have no unspent point tracked, so treat recommendations as next-level targets unless your point count needs correcting.");
  }
  if (wantsToSave) {
    lines.push("Short answer: yes, saving is valid. Spend only when a perk clearly fixes your current weapon, survival, crafting, or utility need.");
  }

  if (scored.length > 0) {
    const bestLabel = profile.autoTrackPoints && profile.unspentPoints === 0 ? "Best next target" : "Best read";
    const listLabel = profile.autoTrackPoints && profile.unspentPoints === 0 ? "Other targets:" : "Other available picks:";
    lines.push("");
    lines.push(`${bestLabel}: ${scored[0].perk.name} Rank ${scored[0].nextRank} is the cleanest fit for the current build read.`);
    lines.push(listLabel);
    scored.forEach((item, index) => {
      const stat = STAT_BY_ID[item.perk.stat];
      lines.push(
        `${index + 1}. ${item.perk.name} Rank ${item.nextRank} - needs ${stat.abbr} ${item.perk.specialReq} and Level ${item.levelReq}; you meet both. ${getMatchedReason(item, weights, profile)}`,
      );
    });
  } else {
    lines.push("");
    lines.push("No tracked perk upgrade cleanly matches this request right now. That usually means the level gate, SPECIAL gate, or current build context is missing.");
  }

  if (blocked.length > 0) {
    lines.push("");
    lines.push("Not yet, but worth tracking:");
    blocked.forEach((item) => {
      const stat = STAT_BY_ID[item.perk.stat];
      const missing = [];
      if (!item.hasSpecial) missing.push(`${stat.abbr} ${item.perk.specialReq} (you have ${item.statValue})`);
      if (!item.hasLevel) missing.push(`Level ${item.levelReq} (you are ${profile.level})`);
      lines.push(`${item.perk.name} Rank ${item.nextRank} is blocked by ${missing.join(" and ")}.`);
    });
  }

  lines.push("");
  lines.push("Save the point: valid option. If none of these solves your current problem, bank it and spend later when the gate or need is clearer.");

  return lines.join("\n");
}

function App() {
  const [profile, setProfile] = useState(() => loadInitialProfile());
  const [tab, setTab] = useState("character");
  const [expandedStats, setExpandedStats] = useState(() => Object.fromEntries(STATS.map((stat) => [stat.id, true])));
  const [advisorMode, setAdvisorMode] = useState("levelup");
  const [levelFocus, setLevelFocus] = useState("Not sure yet");
  const [levelConcern, setLevelConcern] = useState("");
  const [levelReport, setLevelReport] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [backupText, setBackupText] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "advisor",
      content: "Local advisor ready. I only use mechanics, perk gates, and your tracker data.",
    },
  ]);
  const chatRef = useRef(null);

  const gearBonuses = useMemo(() => parseGearBonuses(profile.gearBonuses), [profile.gearBonuses]);
  const effectiveSpecial = useMemo(() => getEffectiveSpecial(profile), [profile]);
  const perkItems = useMemo(() => getPerkItems(profile, effectiveSpecial), [profile, effectiveSpecial]);
  const totalPerkRanks = useMemo(() => getSpentPerkRanks(profile), [profile]);
  const earnedPerkPoints = useMemo(() => getEarnedPerkPoints(profile), [profile]);
  const statPointsSpent = useMemo(() => getStatPointsSpent(profile), [profile]);
  const actualUnspentPoints = useMemo(() => getActualUnspentPoints(profile), [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const patchProfile = (patch) => {
    setProfile((current) => normalizeProfile({ ...current, ...patch }));
  };

  const setLevel = (value) => {
    setProfile((current) => {
      const normalized = normalizeProfile(current);
      const nextLevel = clampNumber(value, 1, 300);
      const delta = nextLevel - normalized.level;
      const nextUnspent = normalized.autoTrackPoints
        ? clampNumber(normalized.unspentPoints + delta, 0, 999)
        : normalized.unspentPoints;

      return normalizeProfile({ ...normalized, level: nextLevel, unspentPoints: nextUnspent });
    });
  };

  const setSpecial = (statId, value) => {
    setProfile((current) => {
      const normalized = normalizeProfile(current);
      const oldValue = normalized.special[statId] || 1;
      const newValue = clampNumber(value, 1, 10);
      const delta = newValue - oldValue;

      const nextUnspent = normalized.autoTrackPoints
        ? clampNumber(normalized.unspentPoints - delta, 0, 999)
        : normalized.unspentPoints;

      return normalizeProfile({
        ...normalized,
        special: { ...normalized.special, [statId]: newValue },
        unspentPoints: nextUnspent,
      });
    });
  };

  const setBobblehead = (statId, checked) => {
    patchProfile({ bobbleheads: { ...profile.bobbleheads, [statId]: checked } });
  };

  const setPerkRank = (item, rank) => {
    const targetRank = clampNumber(rank, 0, item.perk.levels.length);
    const rankState = getRankButtonState(item, targetRank, profile);

    if (!rankState.enabled) return;

    setProfile((current) => {
      const normalized = normalizeProfile(current);
      const effective = getEffectiveSpecial(normalized);
      const currentItem = getPerkItems(normalized, effective).find((perkItem) => perkItem.perk.name === item.perk.name);
      if (!currentItem) return normalized;

      const currentRank = currentItem.currentRank;
      const delta = targetRank - currentRank;
      const nextPerks = { ...normalized.perks };

      if (targetRank === 0) {
        delete nextPerks[currentItem.perk.name];
      } else {
        nextPerks[currentItem.perk.name] = targetRank;
      }

      const nextUnspent = normalized.autoTrackPoints
        ? clampNumber(normalized.unspentPoints - delta, 0, 999)
        : normalized.unspentPoints;

      return normalizeProfile({ ...normalized, perks: nextPerks, unspentPoints: nextUnspent });
    });
  };

  const setMagazineCount = (name, value) => {
    patchProfile({ magazines: { ...profile.magazines, [name]: clampNumber(value, 0, 999) } });
  };

  const sendChat = (text) => {
    const prompt = (text || chatInput).trim();
    if (!prompt) return;

    const reply = buildAdvisorReply(profile, { mode: "chat", prompt });
    setMessages((current) => [...current, { role: "user", content: prompt }, { role: "advisor", content: reply }]);
    setChatInput("");
  };

  const exportBuildData = () => {
    const baseSpecial = Object.entries(profile.special)
      .map(([id, val]) => `${STAT_BY_ID[id].abbr} ${val}`)
      .join(" | ");
    const effectiveStr = Object.entries(effectiveSpecial)
      .map(([id, val]) => `${STAT_BY_ID[id].abbr} ${val}`)
      .join(" | ");

    const unlockedPerks = perkItems.filter((item) => item.currentRank > 0).sort((a, b) => {
      const statDiff = STATS.findIndex((s) => s.id === a.perk.stat) - STATS.findIndex((s) => s.id === b.perk.stat);
      return statDiff !== 0 ? statDiff : a.perk.name.localeCompare(b.perk.name);
    });

    let buildText = `BUILD DATA FOR AI ANALYSIS\n`;
    buildText += `============================\n\n`;
    buildText += `Level: ${profile.level} | Difficulty: ${profile.difficulty} | Unspent Points: ${actualUnspentPoints} | Spent on SPECIAL: ${statPointsSpent}\n`;
    buildText += `SPECIAL (Base): ${baseSpecial}\n`;
    buildText += `SPECIAL (Effective): ${effectiveStr}\n\n`;
    buildText += `PERKS UNLOCKED (${unlockedPerks.length}):\n`;

    const perksbystat = Object.fromEntries(STATS.map((s) => [s.id, []]));
    unlockedPerks.forEach((item) => perksbystat[item.perk.stat].push(item));

    STATS.forEach((stat) => {
      if (perksbystat[stat.id].length > 0) {
        buildText += `\n${stat.name}:\n`;
        perksbystat[stat.id].forEach((item) => {
          buildText += `  - ${item.perk.name} (Rank ${item.currentRank}/${item.perk.levels.length})\n`;
        });
      }
    });

    if (profile.gearBonuses) {
      buildText += `\nGEAR BONUSES: ${profile.gearBonuses}\n`;
    }
    if (profile.playstyle) {
      buildText += `PLAYSTYLE: ${profile.playstyle}\n`;
    }
    if (profile.companion) {
      buildText += `COMPANION: ${profile.companion}\n`;
    }
    if (profile.powerArmor) {
      buildText += `POWER ARMOR: Yes\n`;
    }
    if (profile.notes) {
      buildText += `NOTES: ${profile.notes}\n`;
    }

    buildText += `\n============================\n\n`;
    buildText += `INSTRUCTIONS:\n`;
    buildText += `1. Paste this into ChatGPT/Gemini\n`;
    buildText += `2. Ask any questions about your build\n`;
    buildText += `3. When done, tell the AI:\n\n`;
    buildText += `"Give me your final recommendations in this exact format:\n`;
    buildText += `===FO4_RECOMMENDATIONS===\n`;
    buildText += `Perk Name|Rank 1|Brief reason\n`;
    buildText += `Perk Name|Rank 2|Brief reason\n`;
    buildText += `===END==="\n\n`;
    buildText += `4. Copy the AI's response and paste it into the website\n`;

    navigator.clipboard.writeText(buildText).then(() => {
      alert("Build data + format instructions copied! Paste into ChatGPT, ask for advice, then copy final response back.");
    });
  };

  const runLevelAdvisor = () => {
    setLevelReport(
      buildAdvisorReply(profile, {
        mode: "levelup",
        prompt: levelConcern,
        focus: levelFocus,
        concern: levelConcern,
      }),
    );
  };

  const resetProfile = () => {
    if (window.confirm("Reset this local tracker profile?")) {
      setProfile(createProfile());
      setLevelReport("");
      setBackupText("");
      setBackupStatus("");
      setMessages([
        {
          role: "advisor",
          content: "Local advisor ready. I only use mechanics, perk gates, and your tracker data.",
        },
      ]);
    }
  };

  const exportBackup = async () => {
    const exported = JSON.stringify({ version: 2, profile }, null, 2);
    setBackupText(exported);
    setBackupStatus("Backup generated.");

    try {
      await navigator.clipboard.writeText(exported);
      setBackupStatus("Backup copied to clipboard.");
    } catch {
      setBackupStatus("Backup generated. Copy it from the box.");
    }
  };

  const importBackup = () => {
    try {
      const parsed = JSON.parse(backupText);
      const imported = normalizeProfile(parsed.profile || parsed);
      setProfile(imported);
      setBackupStatus("Backup imported.");
    } catch {
      setBackupStatus("Import failed. Paste a valid tracker backup.");
    }
  };

  return (
    <main className="pipboy-shell">
      <div className="crt-lines" aria-hidden="true" />
      <header className="top-panel">
        <div className="terminal-kicker">VAULT-TEC PERSONAL BUILD DATABASE</div>
        <div className="title-row">
          <h1>Pip-Boy Build Tracker</h1>
          <button className="small-danger" type="button" onClick={resetProfile}>
            Reset
          </button>
        </div>
        <div className="status-grid" aria-label="Character summary">
          <div>
            <span>LVL</span>
            <strong>{profile.level}</strong>
          </div>
          <div>
            <span>POINTS</span>
            <strong>{actualUnspentPoints}</strong>
          </div>
          <div>
            <span>SPENT RANKS</span>
            <strong>{totalPerkRanks}</strong>
          </div>
          <div>
            <span>DIFFICULTY</span>
            <strong>{profile.difficulty}</strong>
          </div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Tracker sections">
        {[
          ["character", "Character"],
          ["perks", "Perks"],
          ["advisor", "Advisor"],
          ["magazines", "Magazines"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            type="button"
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="screen">
        {tab === "character" && (
          <div className="section-grid">
            <section className="panel panel-wide">
              <div className="panel-heading">
                <h2>Character</h2>
                <span>Autosaved locally</span>
              </div>
              <div className="character-grid">
                <label className="field">
                  <span>Level</span>
                  <div className="stepper">
                    <button type="button" onClick={() => setLevel(profile.level - 1)}>
                      -
                    </button>
                    <input
                      inputMode="numeric"
                      min="1"
                      max="300"
                      type="number"
                      value={profile.level}
                      onChange={(event) => setLevel(event.target.value)}
                    />
                    <button type="button" onClick={() => setLevel(profile.level + 1)}>
                      +
                    </button>
                  </div>
                  <em className="field-note">{earnedPerkPoints} level-up points earned</em>
                </label>
                <label className="field">
                  <span>Unspent perk points</span>
                  <div className="stepper">
                    <button type="button" disabled={profile.autoTrackPoints} onClick={() => patchProfile({ unspentPoints: profile.unspentPoints - 1 })}>
                      -
                    </button>
                    <input
                      inputMode="numeric"
                      min="0"
                      type="number"
                      disabled={profile.autoTrackPoints}
                      value={profile.autoTrackPoints ? actualUnspentPoints : profile.unspentPoints}
                      onChange={(event) => patchProfile({ unspentPoints: event.target.value })}
                    />
                    <button type="button" disabled={profile.autoTrackPoints} onClick={() => patchProfile({ unspentPoints: profile.unspentPoints + 1 })}>
                      +
                    </button>
                  </div>
                  <em className="field-note">
                    {profile.autoTrackPoints
                      ? `Auto: earned ${earnedPerkPoints} − perks ${totalPerkRanks} − SPECIAL ${statPointsSpent} = ${actualUnspentPoints}`
                      : "Manual points"}
                  </em>
                </label>
                <label className="toggle-field">
                  <input
                    checked={profile.autoTrackPoints}
                    type="checkbox"
                    onChange={(event) => patchProfile({ autoTrackPoints: event.target.checked })}
                  />
                  <span>Auto points</span>
                </label>
                <label className="field">
                  <span>Difficulty</span>
                  <select value={profile.difficulty} onChange={(event) => patchProfile({ difficulty: event.target.value })}>
                    {DIFFICULTIES.map((difficulty) => (
                      <option key={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </label>
                <label className="toggle-field">
                  <input
                    checked={profile.powerArmor}
                    type="checkbox"
                    onChange={(event) => patchProfile({ powerArmor: event.target.checked })}
                  />
                  <span>Power armor user</span>
                </label>
                <label className="field">
                  <span>Companion in use</span>
                  <input
                    placeholder="Name or blank"
                    value={profile.companion}
                    onChange={(event) => patchProfile({ companion: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>You&apos;re S.P.E.C.I.A.L. book</span>
                  <select
                    value={profile.specialBookStat}
                    onChange={(event) => patchProfile({ specialBookStat: event.target.value })}
                  >
                    <option value="">Not used</option>
                    {STATS.map((stat) => (
                      <option key={stat.id} value={stat.id}>
                        {stat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="panel panel-wide">
              <div className="panel-heading">
                <h2>S.P.E.C.I.A.L.</h2>
                <span>Base plus permanent and gear bonuses</span>
              </div>
              <div className="special-list">
                {STATS.map((stat) => {
                  const base = profile.special[stat.id];
                  const permanent = (profile.bobbleheads[stat.id] ? 1 : 0) + (profile.specialBookStat === stat.id ? 1 : 0);
                  const gear = gearBonuses[stat.id];
                  const effective = effectiveSpecial[stat.id];

                  return (
                    <div className="special-row" key={stat.id}>
                      <div className="special-label">
                        <strong>{stat.abbr}</strong>
                        <span>{stat.name}</span>
                      </div>
                      <div className="pip-track" aria-label={`${stat.name} base ${base}`}>
                        {Array.from({ length: 10 }, (_, index) => (
                          <button
                            className={index < base ? "lit" : ""}
                            key={index}
                            type="button"
                            onClick={() => setSpecial(stat.id, index + 1)}
                            aria-label={`${stat.name} ${index + 1}`}
                          />
                        ))}
                      </div>
                      <label className="mini-check">
                        <input
                          checked={profile.bobbleheads[stat.id]}
                          type="checkbox"
                          onChange={(event) => setBobblehead(stat.id, event.target.checked)}
                        />
                        <span>Bobblehead</span>
                      </label>
                      <div className="effective-stat">
                        <span>EFF</span>
                        <strong>{effective}</strong>
                        <em>
                          {permanent ? `+${permanent} perm` : "0 perm"}
                          {gear ? `, ${gear > 0 ? "+" : ""}${gear} gear` : ""}
                        </em>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Gear Bonuses</h2>
                <span>Example: armor +2 INT, hat +1 AGI</span>
              </div>
              <textarea
                className="notes-area"
                value={profile.gearBonuses}
                onChange={(event) => patchProfile({ gearBonuses: event.target.value })}
                placeholder="armor: +2 INT, +1 AGI"
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Loadout Notes</h2>
                <span>Your words drive the advisor</span>
              </div>
              <textarea
                className="notes-area"
                value={profile.playstyleNotes}
                onChange={(event) => patchProfile({ playstyleNotes: event.target.value })}
                placeholder="I like combat rifles and sneaking sometimes"
              />
            </section>

            <section className="panel panel-wide">
              <div className="panel-heading">
                <h2>Backup</h2>
                <span>Move saves between browsers</span>
              </div>
              <div className="backup-grid">
                <div className="backup-actions">
                  <button className="primary-action" type="button" onClick={exportBackup}>
                    Export backup
                  </button>
                  <button className="secondary-action" type="button" onClick={importBackup}>
                    Import pasted backup
                  </button>
                  <p>{backupStatus || "Exports include your tracked stats, perks, notes, and magazine counts."}</p>
                </div>
                <textarea
                  className="backup-area"
                  value={backupText}
                  onChange={(event) => setBackupText(event.target.value)}
                  placeholder="Export fills this box. Paste a backup here before importing."
                />
              </div>
            </section>
          </div>
        )}

        {tab === "perks" && (
          <div className="perk-layout">
            <aside className="panel perk-summary">
              <div className="panel-heading">
                <h2>Effective SPECIAL</h2>
                <span>Used for gating</span>
              </div>
              <div className="special-caps">
                {STATS.map((stat) => (
                  <div key={stat.id}>
                    <span>{stat.abbr}</span>
                    <strong>{effectiveSpecial[stat.id]}</strong>
                  </div>
                ))}
              </div>
              <div className="perk-controls">
                <label>
                  <input
                    checked={profile.strictPerkGates}
                    type="checkbox"
                    onChange={(event) => patchProfile({ strictPerkGates: event.target.checked })}
                  />
                  <span>Strict gates</span>
                </label>
                <label>
                  <input
                    checked={profile.autoTrackPoints}
                    type="checkbox"
                    onChange={(event) => patchProfile({ autoTrackPoints: event.target.checked })}
                  />
                  <span>Auto spend</span>
                </label>
                <button className="primary-action" type="button" onClick={exportBuildData}>
                  Share Build to AI
                </button>
              </div>
              <p className="quiet-copy">
                Earned {earnedPerkPoints}. Spent on perks {totalPerkRanks}. Spent on SPECIAL {statPointsSpent}. Unspent {actualUnspentPoints}.
              </p>
            </aside>

            <div className="perk-groups">
              {STATS.map((stat) => {
                const statItems = perkItems.filter((item) => item.perk.stat === stat.id);
                const unlocked = statItems.filter((item) => item.currentRank > 0).length;
                return (
                  <section className="panel perk-group" key={stat.id}>
                    <button
                      className="perk-group-title"
                      type="button"
                      onClick={() =>
                        setExpandedStats((current) => ({ ...current, [stat.id]: !current[stat.id] }))
                      }
                    >
                      <span>
                        {stat.abbr} - {stat.name}
                      </span>
                      <em>{unlocked} unlocked</em>
                    </button>
                    {expandedStats[stat.id] && (
                      <div className="perk-grid">
                        {statItems.map((item) => {
                          const gate = getPerkGate(item, profile);
                          const missing = getMissingRequirements(item);
                          const isLocked = missing.length > 0 || (profile.strictPerkGates && profile.autoTrackPoints && actualUnspentPoints < 1 && !item.maxed);

                          return (
                            <div
                              className={`perk-card ${item.currentRank ? "owned" : ""} ${isLocked ? "locked" : ""}`}
                              key={item.perk.name}
                              title={item.perk.summary}
                            >
                              <div className="perk-card-top">
                                <div className="perk-card-name">{item.perk.name}</div>

                                <div className="perk-card-stars">
                                  {Array.from({ length: item.perk.levels.length }, (_, index) => (
                                    <span
                                      key={index}
                                      className={`perk-card-star ${index < item.currentRank ? "" : "empty"}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>

                                <div className="perk-card-reqs">
                                  <span className={item.statValue >= item.perk.specialReq ? "perk-card-req" : "perk-card-req unmet"}>
                                    {stat.abbr} {item.perk.specialReq}
                                  </span>
                                  <span className={profile.level >= (item.nextRank <= item.perk.levels.length ? item.perk.levels[item.nextRank - 1] : 1) ? "perk-card-req" : "perk-card-req unmet"}>
                                    Lvl {item.nextRank <= item.perk.levels.length ? item.perk.levels[item.nextRank - 1] : "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="perk-card-tooltip">
                                <strong>{item.perk.name}</strong>
                                <em>{item.perk.summary}</em>
                                <div style={{ marginTop: "4px", fontSize: "0.7rem" }}>
                                  Rank: {item.currentRank}/{item.perk.levels.length}
                                </div>
                                {isLocked && missing.length > 0 && (
                                  <div style={{ color: "var(--amber)", marginTop: "4px" }}>
                                    Locked: needs {missing.join(", ")}
                                  </div>
                                )}
                                <div style={{ marginTop: "6px", color: "var(--muted)", fontSize: "0.65rem" }}>
                                  Click dots below to rank up/down
                                </div>
                              </div>

                              <div
                                className="rank-dots perk-card-ranks"
                                aria-label={`${item.perk.name} rank`}
                              >
                                {Array.from({ length: item.perk.levels.length }, (_, index) => {
                                  const rank = index + 1;
                                  const rankState = getRankButtonState(item, rank, profile);
                                  return (
                                    <button
                                      className={`${index < item.currentRank ? "filled" : ""} ${rankState.enabled ? "" : "blocked"}`}
                                      disabled={!rankState.enabled}
                                      key={rank}
                                      type="button"
                                      title={rankState.label}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPerkRank(item, item.currentRank === rank ? rank - 1 : rank);
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {tab === "advisor" && (
          <div className="ai-advisor-layout">
            <section className="panel">
              <div className="panel-heading">
                <h2>AI Advisor Response</h2>
                <span>Paste formatted response here</span>
              </div>
              <div className="advisor-form">
                <p className="field-note">
                  1. Click "Share Build to AI" in the Perks tab<br/>
                  2. Ask ChatGPT/Gemini for advice<br/>
                  3. Tell AI to format response as shown<br/>
                  4. Copy response and paste below
                </p>
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Paste the AI response with ===FO4_RECOMMENDATIONS=== format here..."
                  style={{ minHeight: "120px" }}
                />
                <button className="primary-action" type="button" onClick={() => {
                  const recs = parseAIRecommendations(chatInput);
                  if (recs) {
                    setMessages([{ role: "advisor", content: JSON.stringify(recs) }]);
                  } else {
                    alert("Format not recognized. Make sure the response contains:\n===FO4_RECOMMENDATIONS===\nPerk|Rank|Reason\n===END===");
                  }
                }}>
                  Parse Recommendations
                </button>
              </div>
            </section>

            {messages.length > 0 && messages[0].role === "advisor" && (() => {
              try {
                const recommendations = JSON.parse(messages[0].content);
                const perksByName = Object.fromEntries(ALL_PERKS.map(p => [p.name, p]));

                return (
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Suggested Build Path</h2>
                      <span>{recommendations.length} recommended perks</span>
                    </div>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {recommendations.map((rec, index) => {
                        const perk = perksByName[rec.name];
                        const owned = profile.perks[rec.name] || 0;
                        const isBetter = rec.rank > owned;

                        return (
                          <div
                            key={index}
                            style={{
                              padding: "12px",
                              border: `1px solid ${isBetter ? "rgba(212, 165, 116, 0.4)" : "rgba(212, 200, 181, 0.2)"}`,
                              background: isBetter ? "rgba(212, 165, 116, 0.08)" : "rgba(42, 37, 32, 0.3)",
                              borderRadius: "4px",
                              borderLeft: isBetter ? "4px solid rgba(212, 165, 116, 0.6)" : "4px solid rgba(212, 200, 181, 0.2)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                              <strong style={{ color: "var(--green-200)", fontSize: "1rem" }}>
                                {index + 1}. {rec.name}
                              </strong>
                              <span style={{ color: "var(--amber)", fontSize: "0.9rem", fontWeight: "bold" }}>
                                Rank {owned}/{rec.rank}
                              </span>
                            </div>
                            <p style={{ color: "var(--green-300)", fontSize: "0.85rem", margin: "4px 0", lineHeight: "1.4" }}>
                              {rec.reason}
                            </p>
                            {perk && (
                              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "6px 0 0 0", fontStyle: "italic" }}>
                                {perk.summary}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              } catch (e) {
                return null;
              }
            })()}
          </div>
        )}

        {tab === "magazines" && (
          <section className="panel panel-wide">
            <div className="panel-heading">
              <h2>Magazine Counts</h2>
              <span>Counts only</span>
            </div>
            <div className="magazine-grid">
              {MAGAZINE_CATEGORIES.map((name) => (
                <label className="magazine-row" key={name}>
                  <span>{name}</span>
                  <div className="stepper compact">
                    <button type="button" onClick={() => setMagazineCount(name, profile.magazines[name] - 1)}>
                      -
                    </button>
                    <input
                      inputMode="numeric"
                      min="0"
                      type="number"
                      value={profile.magazines[name]}
                      onChange={(event) => setMagazineCount(name, event.target.value)}
                    />
                    <button type="button" onClick={() => setMagazineCount(name, profile.magazines[name] + 1)}>
                      +
                    </button>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
