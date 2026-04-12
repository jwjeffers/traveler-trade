export interface WorldData {
  id: string;
  name: string;
  hex: string;
  uwp: string;
  size: number;
  atmosphere: number;
  temperature: number;
  hydrographics: number;
  population: number;
  government: number;
  lawLevel: number;
  starport: string;
  techLevel: number;
  tradeCodes: string[];
  hasGasGiant?: boolean;
  bases?: string[];
}

export const roll = (dice: number, sides: number = 6): number => {
  let total = 0;
  for (let i = 0; i < dice; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

const SYLLABLES_1 = ["A", "Al", "An", "Ar", "As", "Be", "Bo", "Ca", "Co", "De", "Do", "E", "El", "En", "Es", "Fa", "Fo", "Ga", "Go", "In", "Is", "Ka", "Ko", "Ma", "Mo", "Na", "Ne", "O", "Om", "Pa", "Qu", "Ra", "Re", "Sa", "So", "Ta", "Te", "U", "Ur", "Va", "Za", "Zir", "Xen"];
const SYLLABLES_2 = ["bar", "bor", "can", "cor", "dan", "dar", "dor", "fen", "gan", "gar", "len", "lan", "min", "mon", "nan", "nor", "pen", "pan", "ran", "ron", "sen", "san", "tan", "tor", "van", "vor", "zan", "zor", "gantu", "lax", "tix", "vox", "nix", "lux", "dox", "ros", "rus"];

export const generateRandomName = (): string => {
   const s1 = SYLLABLES_1[Math.floor(Math.random() * SYLLABLES_1.length)];
   const s2 = SYLLABLES_2[Math.floor(Math.random() * SYLLABLES_2.length)];
   const suffix = Math.random() > 0.7 ? ["ia", "a", "us", "on", " Prime", " Major", " Minor", " Secundus"][Math.floor(Math.random() * 8)] : "";
   return s1 + s2 + suffix;
};

// Converts numbers to pseudo-hex (0-9, A-F, G, H...)
export const toPseudoHex = (val: number): string => {
  if (val < 0) return '0';
  if (val > 33) return 'Z'; // fallback
  return "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"[val] || '0';
};

export const calculateTradeCodes = (w: Partial<WorldData>): string[] => {
  const codes: string[] = [];
  const { size = 0, atmosphere = 0, hydrographics = 0, population = 0, government = 0 } = w;

  if (atmosphere >= 4 && atmosphere <= 9 && hydrographics >= 4 && hydrographics <= 8 && population >= 5 && population <= 7) codes.push("Ag");
  if (size === 0 && atmosphere === 0 && hydrographics === 0) codes.push("As");
  if (population === 0 && government === 0) codes.push("Ba");
  if (atmosphere >= 2 && atmosphere <= 9 && hydrographics === 0) codes.push("De");
  if (atmosphere >= 10 && hydrographics >= 1) codes.push("Fl");
  if (size >= 5 && atmosphere >= 4 && atmosphere <= 9 && hydrographics >= 4 && hydrographics <= 8) codes.push("Ga");
  if (population >= 9) codes.push("Hi");
  if (atmosphere <= 1 && hydrographics >= 1) codes.push("Ic");
  if ([0, 1, 2, 4, 7, 9].includes(atmosphere) && population >= 9) codes.push("In");
  if (population >= 1 && population <= 3) codes.push("Lo");
  if (atmosphere <= 3 && hydrographics <= 3 && population >= 6) codes.push("Na");
  if (population >= 4 && population <= 6) codes.push("Ni");
  if (atmosphere >= 2 && atmosphere <= 5 && hydrographics <= 3) codes.push("Po");
  if ([6, 8].includes(atmosphere) && population >= 6 && population <= 8 && government >= 4 && government <= 9) codes.push("Ri");
  if (atmosphere === 0) codes.push("Va");
  if (hydrographics >= 10) codes.push("Wa");

  return codes;
};

export const generateUWPString = (w: Partial<WorldData>): string => {
  return `${w.starport || 'X'}${toPseudoHex(w.size || 0)}${toPseudoHex(w.atmosphere || 0)}${toPseudoHex(w.hydrographics || 0)}${toPseudoHex(w.population || 0)}${toPseudoHex(w.government || 0)}${toPseudoHex(w.lawLevel || 0)}-${toPseudoHex(w.techLevel || 0)}`;
};

export const generateWorld = (name: string = "Unnamed", hex: string = "0000"): WorldData => {
  // Physical
  let size = roll(2) - 2;
  if (size < 0) size = 0;

  let atmosphere = roll(2) - 7 + size;
  if (atmosphere < 0) atmosphere = 0;

  let tempRoll = roll(2);
  if (atmosphere <= 1) tempRoll += 0;
  else if (atmosphere <= 3) tempRoll -= 2;
  else if (atmosphere === 4 || atmosphere === 5 || atmosphere === 14) tempRoll -= 1;
  else if (atmosphere === 6 || atmosphere === 7) tempRoll += 0;
  else if (atmosphere === 8 || atmosphere === 9) tempRoll += 1;
  else if (atmosphere === 10 || atmosphere === 13 || atmosphere === 15) tempRoll += 2;
  else if (atmosphere === 11 || atmosphere === 12) tempRoll += 6;
  
  let temperature = tempRoll; // just keeping raw value for references
  
  let hydrographics = roll(2) - 7 + atmosphere;
  if (size <= 1) hydrographics = 0;
  if (atmosphere <= 1 || atmosphere >= 10 && atmosphere <= 12) hydrographics -= 4;
  if (tempRoll >= 10 && tempRoll <= 11) hydrographics -= 2; // Hot
  else if (tempRoll >= 12) hydrographics -= 6; // Boiling
  
  if (hydrographics < 0) hydrographics = 0;
  if (hydrographics > 10) hydrographics = 10;

  // Societal
  let population = roll(2) - 2;
  if (population < 0) population = 0;

  let government = roll(2) - 7 + population;
  if (population === 0) government = 0;
  if (government < 0) government = 0;

  let lawLevel = roll(2) - 7 + government;
  if (population === 0) lawLevel = 0;
  if (lawLevel < 0) lawLevel = 0;

  // Starport
  let spMod = 0;
  if (population >= 9) spMod = 2;
  else if (population === 8) spMod = 1;
  else if (population <= 4 && population >= 3) spMod = -1;
  else if (population <= 2) spMod = -2;
  
  const spRoll = roll(2) + spMod;
  let starport = 'E';
  if (spRoll <= 2) starport = 'X';
  else if (spRoll === 3 || spRoll === 4) starport = 'E';
  else if (spRoll === 5 || spRoll === 6) starport = 'D';
  else if (spRoll === 7 || spRoll === 8) starport = 'C';
  else if (spRoll === 9 || spRoll === 10) starport = 'B';
  else if (spRoll >= 11) starport = 'A';

  // Tech Level
  let tlRoll = roll(1);
  if (starport === 'A') tlRoll += 6;
  else if (starport === 'B') tlRoll += 4;
  else if (starport === 'C') tlRoll += 2;
  else if (starport === 'X') tlRoll -= 4;

  if (size <= 1) tlRoll += 2;
  else if (size <= 4) tlRoll += 1;

  if (atmosphere <= 3 || atmosphere >= 10) tlRoll += 1;
  if (hydrographics === 9) tlRoll += 1;
  else if (hydrographics === 10) tlRoll += 2;

  if (population >= 1 && population <= 5) tlRoll += 1;
  else if (population === 9) tlRoll += 2;
  else if (population === 10) tlRoll += 4;
  else if (population >= 11) tlRoll += 5;

  if (government === 0 || government === 5) tlRoll += 1;
  else if (government === 13) tlRoll -= 2;

  let techLevel = tlRoll;
  if (techLevel < 0) techLevel = 0;
  if (population === 0) techLevel = 0; // null TL for empty worlds usually

  // Generate UWP string
  const uwp = generateUWPString({ starport, size, atmosphere, hydrographics, population, government, lawLevel, techLevel });

  const tradeCodes = calculateTradeCodes({ size, atmosphere, hydrographics, population, government, lawLevel });

  // Gas Giant and Bases Logic
  const hasGasGiant = roll(2) <= 10;
  const bases: string[] = [];
  
  if (starport === 'A') {
    if (roll(2) >= 8) bases.push('Naval');
    if (roll(2) >= 10) bases.push('Scout');
  } else if (starport === 'B') {
    if (roll(2) >= 8) bases.push('Naval');
    if (roll(2) >= 9) bases.push('Scout');
  } else if (starport === 'C') {
    if (roll(2) >= 8) bases.push('Scout');
  } else if (starport === 'D') {
    if (roll(2) >= 7) bases.push('Scout');
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    hex,
    uwp,
    size,
    atmosphere,
    temperature,
    hydrographics,
    population,
    government,
    lawLevel,
    starport,
    techLevel,
    tradeCodes,
    hasGasGiant,
    bases
  };
};
