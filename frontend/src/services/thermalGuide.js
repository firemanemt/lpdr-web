/**
 * Thermal Identification Guide
 * Reference data for distinguishing pet heat signatures from other sources
 */

export const THERMAL_GUIDE = {
  signatures: [
    {
      category: 'Dogs',
      icon: '🐕',
      tempRange: '101-103°F',
      appearance: 'Medium-to-large warm blob, often elongated. Moves steadily. Tail creates subtle secondary heat. Panting shows cooler nose area.',
      confusion: 'Can be confused with coyotes, foxes, or large raccoons. Dogs are more likely near homes/roads.',
      bestPalette: 'Iron or Rainbow — shows temperature gradients clearly',
      imageDesc: '🏃 Medium warm mass, deliberate movement',
    },
    {
      category: 'Cats',
      icon: '🐈',
      tempRange: '101-102°F',
      appearance: 'Small, compact warm spot. Often STATIONARY — cats freeze and hide. May show as a warm dot under a deck or against a wall. Very small target.',
      confusion: 'Raccoons, possums, large rats. Cats tend to be near structures, raccoons near trash/trees.',
      bestPalette: 'White Hot or Iron — maximizes contrast for small targets',
      imageDesc: '📍 Small stationary warm dot near structures',
    },
    {
      category: 'Horses',
      icon: '🐴',
      tempRange: '99-100°F',
      appearance: 'LARGE warm mass — impossible to miss. Often in open fields. Body is elongated with four cooler legs. May be with other horses (herd animals).',
      confusion: 'Cows, deer. Horses have longer necks and tails. Context matters — horses near fences/pastures.',
      bestPalette: 'Any — horses are obvious on all palettes',
      imageDesc: '🫎 Large unmistakable warm mass',
    },
    {
      category: 'Birds',
      icon: '🦜',
      tempRange: '105-108°F',
      appearance: 'Very HOT small target — appears as a bright pinpoint in tree canopy. Hottest pet signature. Stays in treetops or on lines.',
      confusion: 'Squirrels, other birds. Pet birds are usually alone and in unusual locations for wild birds.',
      bestPalette: 'Black Hot or White Hot — maximizes small hot target visibility',
      imageDesc: '🔥 Tiny very-hot point in tree tops',
    },
  ],
  falsePositives: [
    {
      source: 'Deer',
      tempRange: '100-103°F',
      appearance: 'Medium-large warm mass, similar to large dog. Moves in groups. Usually in wooded/open areas, not near homes.',
      howToDistinguish: 'Deer move in herds and flee from the drone. Lost dogs may approach or freeze. Location matters — deer in woods, dogs near homes.',
    },
    {
      source: 'Raccoons',
      tempRange: '97-101°F',
      appearance: 'Medium warm blob, often in trees or near trash. Moves deliberately. Similar size to a cat.',
      howToDistinguish: 'Raccoons have a distinctive waddling gait. They climb trees. Cats stay low to the ground and freeze, not climb.',
    },
    {
      source: 'Possums',
      tempRange: '93-97°F',
      appearance: 'Low-temperature warm spot — cooler than cats/dogs. Slow-moving. Near ground level.',
      howToDistinguish: 'Possums are noticeably COOLER than cats on thermal. They move slowly. They play dead when approached, cats bolt.',
    },
    {
      source: 'HVAC Vents',
      tempRange: '90-140°F',
      appearance: 'Stationary warm spots on roofs or sides of buildings. Can mimic a resting animal.',
      howToDistinguish: 'Vents don\'t move. Watch for 30 seconds — if it doesn\'t move at all, it\'s likely structural. Pets shift position.',
    },
    {
      source: 'Solar Panels',
      tempRange: '100-150°F',
      appearance: 'Large warm rectangles on roofs. Can be very bright on thermal.',
      howToDistinguish: 'Rectangular shape is a dead giveaway. Pets are round/organic shapes.',
    },
    {
      source: 'Compost/Mulch',
      tempRange: '90-140°F',
      appearance: 'Ground-level warm patches. Can mimic a resting animal.',
      howToDistinguish: 'Diffuse edges (no distinct outline). Doesn\'t move. Usually near gardens. Pets have a defined shape.',
    },
    {
      source: 'Storm Drains',
      tempRange: '50-70°F',
      appearance: 'Cool spots in warm ground — reverse contrast. Animals may shelter in them.',
      howToDistinguish: 'Look for a warm spot INSIDE or near the cool drain opening. That warm spot could be the pet.',
    },
    {
      source: 'Other Pets',
      tempRange: 'Varies',
      appearance: 'Outdoor cats, free-roaming dogs, chickens. Common in rural and suburban areas.',
      howToDistinguish: 'Compare size and location with the lost pet description. Ask the owner about neighborhood animals.',
    },
  ],
  tips: {
    nightVsDay: {
      title: 'Night vs Day',
      content: 'Night flights are dramatically more effective. Ground cools rapidly after sunset, making warm-blooded animals glow like beacons. Daytime thermal requires more experience — sun-warmed surfaces create noise. Fly at 150ft at night, 200ft+ during day to reduce ground clutter.',
    },
    altitude: {
      title: 'Altitude Selection',
      content: 'Thermal: 100-200ft AGL for dogs/horses, 50-100ft for cats/rabbits. Visual: 30-80ft. Lower altitude = better detail but smaller coverage area. Start high for thermal sweep, descend to investigate.',
    },
    palettes: {
      title: 'Color Palettes',
      content: 'White Hot: Best for spotting — animals appear bright white on dark background. Iron: Best for identification — temperature gradients help distinguish species. Black Hot: Good for high-contrast daytime. Rainbow: Good for temperature analysis but harder to spot targets quickly.',
    },
    windCompensation: {
      title: 'Wind Compensation',
      content: 'Wind cools exposed surfaces on animals, reducing thermal contrast. In high winds, fly lower and slower. Animals in wind also seek shelter — check structures and windbreaks first.',
    },
  },
};

/**
 * Get thermal info for a specific pet type
 */
export function getThermalInfo(petType) {
  return THERMAL_GUIDE.signatures.find(s => s.category.toLowerCase() === petType) || null;
}
