export type TradeCode = 'Ag' | 'As' | 'Ba' | 'De' | 'Fl' | 'Ga' | 'Hi' | 'Ht' | 'Ic' | 'In' | 'Lo' | 'Lt' | 'Na' | 'Ni' | 'Po' | 'Ri' | 'Wa' | 'Va' | 'Amber' | 'Red';

export interface Modifier {
  code: TradeCode;
  bonus: number;
}

export interface TradeGood {
  d66: number;
  type: string;
  availability: TradeCode[] | 'All' | 'None';
  tons: string;
  basePrice: number;
  purchaseDMs: Modifier[];
  saleDMs: Modifier[];
  examples: string;
  isIllegal?: boolean;
}

export const TRADE_GOODS: TradeGood[] = [
  {
    d66: 11, type: 'Common Electronics', availability: 'All', tons: '2D x 10', basePrice: 20000,
    purchaseDMs: [{ code: 'In', bonus: 2 }, { code: 'Ht', bonus: 3 }, { code: 'Ri', bonus: 1 }],
    saleDMs: [{ code: 'Ni', bonus: 2 }, { code: 'Lt', bonus: 1 }, { code: 'Po', bonus: 1 }],
    examples: 'Simple electronics including basic computers up to TL 10'
  },
  {
    d66: 12, type: 'Common Machine Parts', availability: 'All', tons: '2D x 10', basePrice: 10000,
    purchaseDMs: [{ code: 'Na', bonus: 2 }, { code: 'In', bonus: 5 }],
    saleDMs: [{ code: 'Ag', bonus: 2 }, { code: 'Ni', bonus: 3 }],
    examples: 'Machine components and spare parts for common machinery'
  },
  {
    d66: 13, type: 'Common Manufactured Goods', availability: 'All', tons: '2D x 10', basePrice: 10000,
    purchaseDMs: [{ code: 'Na', bonus: 2 }, { code: 'In', bonus: 5 }],
    saleDMs: [{ code: 'Ni', bonus: 3 }, { code: 'Hi', bonus: 2 }],
    examples: 'Household appliances, clothing and so forth'
  },
  {
    d66: 14, type: 'Common Raw Materials', availability: 'All', tons: '2D x 20', basePrice: 5000,
    purchaseDMs: [{ code: 'Ag', bonus: 3 }, { code: 'Ga', bonus: 2 }],
    saleDMs: [{ code: 'In', bonus: 2 }, { code: 'Po', bonus: 2 }],
    examples: 'Metals, plastics, chemicals and other basic materials'
  },
  {
    d66: 15, type: 'Common Consumables', availability: 'All', tons: '2D x 20', basePrice: 500,
    purchaseDMs: [{ code: 'Ag', bonus: 3 }, { code: 'Wa', bonus: 2 }, { code: 'Ga', bonus: 1 }, { code: 'As', bonus: -4 }],
    saleDMs: [{ code: 'As', bonus: 1 }, { code: 'Fl', bonus: 1 }, { code: 'Ic', bonus: 1 }, { code: 'Hi', bonus: 1 }],
    examples: 'Food, drink and other agricultural products'
  },
  {
    d66: 16, type: 'Common Ore', availability: 'All', tons: '2D x 20', basePrice: 1000,
    purchaseDMs: [{ code: 'As', bonus: 4 }],
    saleDMs: [{ code: 'In', bonus: 3 }, { code: 'Ni', bonus: 1 }],
    examples: 'Ore bearing common metals'
  },
  {
    d66: 21, type: 'Advanced Electronics', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 100000,
    purchaseDMs: [{ code: 'In', bonus: 2 }, { code: 'Ht', bonus: 3 }],
    saleDMs: [{ code: 'Ni', bonus: 2 }, { code: 'As', bonus: 1 }, { code: 'Ri', bonus: 1 }],
    examples: 'Advanced sensors, computers and other electronics up to TL 15'
  },
  {
    d66: 22, type: 'Advanced Machine Parts', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 75000,
    purchaseDMs: [{ code: 'In', bonus: 2 }, { code: 'Ht', bonus: 2 }],
    saleDMs: [{ code: 'As', bonus: 2 }, { code: 'Ni', bonus: 1 }],
    examples: 'Machine components and spare parts, including gravitic components'
  },
  {
    d66: 23, type: 'Advanced Manufactured Goods', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 100000,
    purchaseDMs: [{ code: 'In', bonus: 1 }],
    saleDMs: [{ code: 'Hi', bonus: 1 }, { code: 'Ri', bonus: 2 }],
    examples: 'Devices and clothing incorporating advanced technologies'
  },
  {
    d66: 24, type: 'Advanced Weapons', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 150000,
    purchaseDMs: [{ code: 'Ht', bonus: 2 }],
    saleDMs: [{ code: 'Po', bonus: 1 }, { code: 'Amber', bonus: 2 }, { code: 'Red', bonus: 4 }],
    examples: 'Firearms, explosives, ammunition, artillery and other military-grade'
  },
  {
    d66: 25, type: 'Advanced Vehicles', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 180000,
    purchaseDMs: [{ code: 'Ht', bonus: 2 }],
    saleDMs: [{ code: 'As', bonus: 2 }, { code: 'Ri', bonus: 2 }],
    examples: 'Airrafts, spacecraft, grav tanks and other vehicles up to TL15'
  },
  {
    d66: 31, type: 'Crystals & Gems', availability: ['As', 'De', 'Ic'], tons: '1D', basePrice: 20000,
    purchaseDMs: [{ code: 'As', bonus: 2 }, { code: 'De', bonus: 1 }, { code: 'Ic', bonus: 1 }],
    saleDMs: [{ code: 'In', bonus: 3 }, { code: 'Ri', bonus: 2 }],
    examples: 'Diamonds, synthetic or natural gemstones'
  },
  {
    d66: 32, type: 'Cybernetics', availability: ['Ht'], tons: '1D', basePrice: 250000,
    purchaseDMs: [{ code: 'Ht', bonus: 1 }],
    saleDMs: [{ code: 'As', bonus: 1 }, { code: 'Ic', bonus: 1 }, { code: 'Ri', bonus: 2 }],
    examples: 'Cybernetic components, replacement limbs'
  },
  {
    d66: 33, type: 'Live Animals', availability: ['Ag', 'Ga'], tons: '1D x 10', basePrice: 10000,
    purchaseDMs: [{ code: 'Ag', bonus: 2 }],
    saleDMs: [{ code: 'Lo', bonus: 3 }],
    examples: 'Riding animals, beasts of burden, exotic pets'
  },
  {
    d66: 34, type: 'Luxury Consumables', availability: ['Ag', 'Ga', 'Wa'], tons: '1D x 10', basePrice: 20000,
    purchaseDMs: [{ code: 'Ag', bonus: 2 }, { code: 'Wa', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 2 }, { code: 'Hi', bonus: 2 }],
    examples: 'Rare foods, fine liquors'
  },
  {
    d66: 35, type: 'Luxury Goods', availability: ['Hi'], tons: '1D', basePrice: 200000,
    purchaseDMs: [{ code: 'Hi', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 4 }],
    examples: 'Rare or extremely high-quality manufactured goods'
  },
  {
    d66: 36, type: 'Medical Supplies', availability: ['Ht', 'Hi'], tons: '1D x 5', basePrice: 50000,
    purchaseDMs: [{ code: 'Ht', bonus: 2 }],
    saleDMs: [{ code: 'In', bonus: 2 }, { code: 'Po', bonus: 1 }, { code: 'Ri', bonus: 1 }],
    examples: 'Diagnostic equipment, basic drugs, cloning technology'
  },
  {
    d66: 41, type: 'Petrochemicals', availability: ['De', 'Fl', 'Ic', 'Wa'], tons: '1D x 10', basePrice: 10000,
    purchaseDMs: [{ code: 'De', bonus: 2 }],
    saleDMs: [{ code: 'In', bonus: 2 }, { code: 'Ag', bonus: 1 }, { code: 'Lt', bonus: 2 }],
    examples: 'Oil, liquid fuels'
  },
  {
    d66: 42, type: 'Pharmaceuticals', availability: ['As', 'De', 'Hi', 'Wa'], tons: '1D', basePrice: 100000,
    purchaseDMs: [{ code: 'As', bonus: 2 }, { code: 'Hi', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 2 }, { code: 'Lt', bonus: 1 }],
    examples: 'Drugs, medical supplies, anagathics, fast or slow drugs'
  },
  {
    d66: 43, type: 'Polymers', availability: ['In'], tons: '1D x 10', basePrice: 7000,
    purchaseDMs: [{ code: 'In', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 2 }, { code: 'Ni', bonus: 1 }],
    examples: 'Plastics and other synthetics'
  },
  {
    d66: 44, type: 'Precious Metals', availability: ['As', 'De', 'Ic', 'Fl'], tons: '1D', basePrice: 50000,
    purchaseDMs: [{ code: 'As', bonus: 3 }, { code: 'De', bonus: 1 }, { code: 'Ic', bonus: 2 }],
    saleDMs: [{ code: 'Ri', bonus: 3 }, { code: 'In', bonus: 2 }, { code: 'Ht', bonus: 1 }],
    examples: 'Gold, silver, platinum, rare elements'
  },
  {
    d66: 45, type: 'Radioactives', availability: ['As', 'De', 'Lo'], tons: '1D', basePrice: 1000000,
    purchaseDMs: [{ code: 'As', bonus: 2 }, { code: 'Lo', bonus: 2 }],
    saleDMs: [{ code: 'In', bonus: 3 }, { code: 'Ht', bonus: 1 }, { code: 'Ni', bonus: -2 }, { code: 'Ag', bonus: -3 }],
    examples: 'Uranium, plutonium, unobtanium, rare elements'
  },
  {
    d66: 46, type: 'Robots', availability: ['In'], tons: '1D x 5', basePrice: 400000,
    purchaseDMs: [{ code: 'In', bonus: 1 }],
    saleDMs: [{ code: 'Ag', bonus: 2 }, { code: 'Ht', bonus: 1 }],
    examples: 'Industrial and personal robots and drones'
  },
  {
    d66: 47, type: 'Spices', availability: ['Ga', 'De', 'Wa'], tons: '1D x 10', basePrice: 6000,
    purchaseDMs: [{ code: 'De', bonus: 2 }],
    saleDMs: [{ code: 'Hi', bonus: 2 }, { code: 'Ri', bonus: 3 }, { code: 'Po', bonus: 3 }],
    examples: 'Preservatives, luxury food additives, natural drugs'
  },
  {
    d66: 52, type: 'Textiles', availability: ['Ag', 'Ni'], tons: '1D x 20', basePrice: 3000,
    purchaseDMs: [{ code: 'Ag', bonus: 7 }],
    saleDMs: [{ code: 'Hi', bonus: 3 }, { code: 'Na', bonus: 2 }],
    examples: 'Clothing and fabrics'
  },
  {
    d66: 53, type: 'Uncommon Ore', availability: ['As', 'Ic'], tons: '1D x 20', basePrice: 5000,
    purchaseDMs: [{ code: 'As', bonus: 4 }],
    saleDMs: [{ code: 'In', bonus: 3 }, { code: 'Ni', bonus: 1 }],
    examples: 'Ore containing precious or valuable metals'
  },
  {
    d66: 54, type: 'Uncommon Raw Materials', availability: ['Ag', 'De', 'Wa'], tons: '1D x 10', basePrice: 20000,
    purchaseDMs: [{ code: 'Ag', bonus: 2 }, { code: 'Wa', bonus: 1 }],
    saleDMs: [{ code: 'In', bonus: 2 }, { code: 'Ht', bonus: 1 }],
    examples: 'Valuable metals like titanium, rare elements'
  },
  {
    d66: 55, type: 'Wood', availability: ['Ag', 'Ga'], tons: '1D x 20', basePrice: 1000,
    purchaseDMs: [{ code: 'Ag', bonus: 6 }],
    saleDMs: [{ code: 'Ri', bonus: 2 }, { code: 'In', bonus: 1 }],
    examples: 'Hard or beautiful woods and plant extracts'
  },
  {
    d66: 56, type: 'Vehicles', availability: ['In', 'Ht'], tons: '1D x 10', basePrice: 15000,
    purchaseDMs: [{ code: 'In', bonus: 2 }, { code: 'Ht', bonus: 1 }],
    saleDMs: [{ code: 'Ni', bonus: 2 }, { code: 'Hi', bonus: 1 }],
    examples: 'Wheeled, tracked and other vehicles from TL10 or lower'
  },
  {
    d66: 61, type: 'Illegal Biochemicals', availability: ['Wa'], tons: '1D x 5', basePrice: 50000,
    purchaseDMs: [{ code: 'Wa', bonus: 2 }],
    saleDMs: [{ code: 'In', bonus: 6 }],
    examples: 'Dangerous chemicals, extracts from endangered species',
    isIllegal: true
  },
  {
    d66: 62, type: 'Cybernetics, Illegal', availability: ['Ht'], tons: '1D', basePrice: 250000,
    purchaseDMs: [{ code: 'Ht', bonus: 1 }],
    saleDMs: [{ code: 'As', bonus: 4 }, { code: 'Ic', bonus: 4 }, { code: 'Ri', bonus: 8 }, { code: 'Amber', bonus: 6 }, { code: 'Red', bonus: 6 }],
    examples: 'Combat cybernetics, illegal enhancements',
    isIllegal: true
  },
  {
    d66: 63, type: 'Drugs, Illegal', availability: ['As', 'De', 'Hi', 'Wa'], tons: '1D', basePrice: 100000,
    purchaseDMs: [{ code: 'As', bonus: 1 }, { code: 'De', bonus: 1 }, { code: 'Ga', bonus: 1 }, { code: 'Wa', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 6 }, { code: 'Hi', bonus: 6 }],
    examples: 'Addictive drugs, combat drugs',
    isIllegal: true
  },
  {
    d66: 64, type: 'Luxuries, Illegal', availability: ['Ag', 'Ga', 'Wa'], tons: '1D x 5', basePrice: 50000,
    purchaseDMs: [{ code: 'Ag', bonus: 2 }, { code: 'Wa', bonus: 1 }],
    saleDMs: [{ code: 'Ri', bonus: 6 }, { code: 'Hi', bonus: 4 }],
    examples: 'Debauched or addictive luxuries',
    isIllegal: true
  },
  {
    d66: 65, type: 'Weapons, Illegal', availability: ['In', 'Ht'], tons: '1D x 5', basePrice: 150000,
    purchaseDMs: [{ code: 'Ht', bonus: 2 }],
    saleDMs: [{ code: 'Po', bonus: 6 }, { code: 'Amber', bonus: 8 }, { code: 'Red', bonus: 10 }],
    examples: 'Weapons of mass destruction, naval weapons',
    isIllegal: true
  },
  {
    d66: 66, type: 'Exotics', availability: 'None', tons: '1D', basePrice: 0,
    purchaseDMs: [],
    saleDMs: [],
    examples: 'Exotic goods outside normal trade rules'
  }
];

export const MODIFIED_PRICE_TABLE = [
  { maxBound: -3, purchase: 3.00, sale: 0.10 },
  { maxBound: -2, purchase: 2.50, sale: 0.20 },
  { maxBound: -1, purchase: 2.00, sale: 0.30 },
  { maxBound: 0, purchase: 1.75, sale: 0.40 },
  { maxBound: 1, purchase: 1.50, sale: 0.45 },
  { maxBound: 2, purchase: 1.35, sale: 0.50 },
  { maxBound: 3, purchase: 1.25, sale: 0.55 },
  { maxBound: 4, purchase: 1.20, sale: 0.60 },
  { maxBound: 5, purchase: 1.15, sale: 0.65 },
  { maxBound: 6, purchase: 1.10, sale: 0.70 },
  { maxBound: 7, purchase: 1.05, sale: 0.75 },
  { maxBound: 8, purchase: 1.00, sale: 0.80 },
  { maxBound: 9, purchase: 0.95, sale: 0.85 },
  { maxBound: 10, purchase: 0.90, sale: 0.90 },
  { maxBound: 11, purchase: 0.85, sale: 1.00 },
  { maxBound: 12, purchase: 0.80, sale: 1.05 },
  { maxBound: 13, purchase: 0.75, sale: 1.10 },
  { maxBound: 14, purchase: 0.70, sale: 1.15 },
  { maxBound: 15, purchase: 0.65, sale: 1.20 },
  { maxBound: 16, purchase: 0.60, sale: 1.25 },
  { maxBound: 17, purchase: 0.55, sale: 1.30 },
  { maxBound: 18, purchase: 0.50, sale: 1.40 },
  { maxBound: 19, purchase: 0.45, sale: 1.50 },
  { maxBound: 20, purchase: 0.40, sale: 1.60 },
  { maxBound: 21, purchase: 0.35, sale: 1.75 },
  { maxBound: 22, purchase: 0.30, sale: 2.00 },
  { maxBound: 23, purchase: 0.25, sale: 2.50 },
  { maxBound: 24, purchase: 0.20, sale: 3.00 },
  { maxBound: 999, purchase: 0.15, sale: 4.00 } // 25+
];
