/**
 * Pet Behavior & Search Intelligence
 * Species-specific data for drone pilots searching for lost pets
 */

export const PET_PROFILES = {
  dog: {
    label: 'Dog',
    icon: '🐕',
    typicalRange: {
      friendly: '1-5 miles — often approaches strangers',
      skittish: '0.5-2 miles — hides under vehicles, porches, sheds',
      aggressive: '0.25-1 mile — stays put, may defend territory',
      unknown: '0.5-5 miles — varies widely by breed and temperament',
    },
    travelPattern: 'Dogs generally follow roads, trails, and scent lines. Friendly dogs approach people and may be taken in. Skittish dogs hunker down and move at night.',
    hidingSpots: ['Under decks/porches', 'Inside open garages/sheds', 'Under vehicles', 'Dense brush near roads', 'Familiar locations (previous homes, parks)', 'Storm drains/culverts'],
    thermalSignature: {
      temp: '101-102.5°F body temp — strong thermal contrast on cool ground',
      bestTime: 'Dusk to dawn — ground is cool, dog stands out clearly',
      tips: 'Dogs are larger thermal targets than cats. Look for movement patterns. Panting dogs may show cooler nose but warm body.',
    },
    searchStrategy: {
      day1: 'Fly a 1-mile grid around last seen. Check roads and trails first — dogs follow paths of least resistance.',
      day2: 'Expand to 3-mile grid. Focus on water sources, parks, and areas where people congregate. Post flyers.',
      day3plus: 'Expand to 5-mile grid. Night flights are critical — skittish dogs move after dark. Check industrial areas and wooded edges.',
    },
    timeBehavior: 'Most active dawn and dusk. Skittish dogs become nocturnal after 24+ hours. Friendly dogs may approach homes during meal times.',
  },
  cat: {
    label: 'Cat',
    icon: '🐈',
    typicalRange: {
      friendly: 'Very close — often hiding within 3-5 houses of home',
      skittish: 'Within 500ft of escape point — frozen in fear, won\'t respond to calls',
      aggressive: 'Within 100ft — typically hiding in immediate area',
      unknown: 'Within 500ft — 90% of indoor cats are found within this radius',
    },
    travelPattern: 'Indoor cats that escape almost NEVER go far. They freeze and hide in silence. They do NOT come when called. Outdoor-access cats may be trapped or injured within their territory.',
    hidingSpots: ['Under decks/porches (very common)', 'Inside sheds/garages', 'Up in trees (rare but happens)', 'Inside neighbor homes (through open doors)', 'Under cars — on top of tires', 'Storm window wells', 'Inside walls/crawlspaces', 'Inside RVs/campers'],
    thermalSignature: {
      temp: '101.5°F body temp — small but detectable thermal target',
      bestTime: 'Night — cats are warm against cool ground. Pre-dawn is optimal.',
      tips: 'Cats are SMALL thermal targets — fly lower and slower than dog searches. Look in tight clusters of heat near structures. A cat under a deck shows as a warm spot against a cold surface.',
    },
    searchStrategy: {
      day1: 'Fly a TIGHT grid — 3-house radius. Cats don\'t go far. Focus on structures, decks, porches. They often hide in plain sight.',
      day2: 'Same radius, night flight with thermal. Indoor cats are nocturnal and may move at 2-5am. Check every structure within 500ft.',
      day3plus: 'Expand slightly but stay within 1000ft. Check for "trap-neuter-return" colonies where lost cats may join. Place humane traps with smelly food.',
    },
    timeBehavior: 'Most active 2-5am. This is the GOLDEN WINDOW for thermal drone flights. They will NOT respond during daytime. Night flights are essential.',
  },
  horse: {
    label: 'Horse',
    icon: '🐴',
    typicalRange: {
      friendly: '1-10 miles — horses often stay on trails or follow fence lines',
      skittish: '0.5-3 miles — may bolt, then stop and graze',
      aggressive: 'Stays in familiar pasture area',
      unknown: '1-5 miles — horses tend to stay near water and grazing',
    },
    travelPattern: 'Horses follow fence lines, trails, and water sources. They stay in herds if separated from companions they will search for them. Often found on neighboring properties.',
    hidingSpots: ['Open fields/pastures', 'Along fence lines', 'Near water sources', 'In wooded areas for shade', 'Neighboring farms/properties', 'Along trail systems'],
    thermalSignature: {
      temp: '99.7-100.4°F — LARGE thermal target, very easy to spot',
      bestTime: 'Any time — horses are so large they show clearly even in daylight thermal',
      tips: 'Horses are the easiest target for thermal drones. Their large body mass creates a huge heat signature. Look for movement across open terrain.',
    },
    searchStrategy: {
      day1: 'Fly fence lines and neighboring properties first. Horses rarely go far — they stick to familiar territory. Check water sources.',
      day2: 'Expand grid to 5 miles. Focus on trails and roads. Check all farms in the area.',
      day3plus: 'Expand to 10 miles along trail networks. Check state forests and park lands.',
    },
    timeBehavior: 'Active during day, rest at night. Easy to spot at any time with thermal. Check water sources morning and evening.',
  },
  bird: {
    label: 'Bird',
    icon: '🦜',
    typicalRange: {
      friendly: 'May stay in trees near home if clipped wings',
      skittish: 'Can fly significant distance — wind dependent',
      aggressive: 'Often stays in immediate area defending territory',
      unknown: 'Highly variable — wind and species dependent',
    },
    travelPattern: 'Parrots and pet birds often stay within 100ft of home for the first 24 hours, then may range further. They typically land in tall trees and refuse to come down. Wind can carry small birds far.',
    hidingSpots: ['Tall trees near home', 'Roof gutters', 'Power lines', 'Inside tree cavities', 'On building ledges', 'Neighboring trees'],
    thermalSignature: {
      temp: '105-108°F body temp — VERY hot but small target',
      bestTime: 'Early morning before sun warms trees — bird stands out against cool canopy',
      tips: 'Birds have the HIGHEST body temp of common pets. Small target but very hot. Fly close to tree canopy. Look for single hot spots in tree tops.',
    },
    searchStrategy: {
      day1: 'Fly immediately — birds often stay in trees near home. Check ALL trees within 200ft. Call the bird\'s name — many will respond.',
      day2: 'Expand to 1/4 mile. Check trees, power lines, and rooflines. Morning flights are best — birds vocalize at dawn.',
      day3plus: 'Expand to 1 mile. Probability drops significantly after 72 hours. Check for sightings on local lost pet groups.',
    },
    timeBehavior: 'Most vocal at dawn and dusk — fly then to locate by sound. Roost at night in tall trees. May respond to owner\'s voice or favorite sounds.',
  },
  rabbit: {
    label: 'Rabbit',
    icon: '🐇',
    typicalRange: {
      friendly: 'Very close — typically within 100ft of escape point',
      skittish: 'Freeze in place within 50ft — will not move for hours',
      aggressive: 'N/A — rabbits do not show aggressive escape behavior',
      unknown: 'Within 100ft — rabbits freeze and hide',
    },
    travelPattern: 'Domestic rabbits do NOT run far. They freeze and hide. They lack survival instincts of wild rabbits. They will stay in the exact same spot for days unless forced to move.',
    hidingSpots: ['Under bushes', 'In flower gardens', 'Under decks', 'In tall grass', 'Under parked cars', 'Against building foundations'],
    thermalSignature: {
      temp: '102-103°F — small but warm target',
      bestTime: 'Night — rabbit body temp contrasts well with cool ground and vegetation',
      tips: 'Rabbits are small but warm. They stay VERY still — look for a stationary warm blob near ground level. They will not move even when the drone is overhead.',
    },
    searchStrategy: {
      day1: 'Fly a VERY tight grid within 100ft of escape point. Rabbits do not go far. Check every bush, garden, and hiding spot.',
      day2: 'Same area with thermal at night. The rabbit is likely still there, just invisible in daylight.',
      day3plus: 'Slightly expand but stay within 200ft. Place humane traps. Rabbits generally do not survive long outdoors due to predators.',
    },
    timeBehavior: 'Crepuscular — active at dawn and dusk. But a scared domestic rabbit may not move at all. Night thermal is the best approach.',
  },
  reptile: {
    label: 'Reptile',
    icon: '🦎',
    typicalRange: {
      friendly: 'Very close — most reptiles stay within 50ft',
      skittish: 'Hide in nearest warm spot',
      aggressive: 'Stay in immediate area',
      unknown: 'Within 50ft — seek warmth',
    },
    travelPattern: 'Reptiles seek warmth. They will find the nearest heat source — sunny rocks, asphalt, HVAC units, compost piles. They move very slowly and stay put once comfortable.',
    hidingSpots: ['On warm surfaces (asphalt, rocks)', 'Near HVAC units', 'In compost piles', 'Under rocks/logs', 'On sunlit walls/fences', 'Near water sources (turtles)'],
    thermalSignature: {
      temp: 'AMBIENT temperature — COLD-BLOODED. Extremely difficult to detect with thermal.',
      bestTime: 'Midday — when reptile has been basking and is warmest relative to surroundings',
      tips: 'Thermal is nearly useless for reptiles — they match ambient temperature. Focus on visual search instead. Look for movement on warm surfaces.',
    },
    searchStrategy: {
      day1: 'Visual search only — thermal will NOT help. Check all warm surfaces near escape point. Look on sunny walls, rocks, and asphalt.',
      day2: 'Same approach. Reptiles don\'t go far. Check water features for turtles. Check warm hiding spots for snakes and lizards.',
      day3plus: 'Expand slightly. Reptiles may have found a new warm shelter. Check basements, garages, and crawlspaces.',
    },
    timeBehavior: 'Bask during midday heat. Hide during cool periods. Turtles near water. Snakes near warm hiding spots. Lizards on sunlit surfaces.',
  },
  other: {
    label: 'Other Pet',
    icon: '🐾',
    typicalRange: {
      friendly: 'Varies by species',
      skittish: 'Typically stays close to escape point',
      aggressive: 'Stays in immediate area',
      unknown: 'Check with owner for species-specific behavior',
    },
    travelPattern: 'Ask the owner about the specific animal\'s behavior patterns. Most escaped pets stay close to home.',
    hidingSpots: ['Check with owner for species-specific hiding patterns', 'Near escape point', 'In familiar-smelling areas', 'Near food/water sources'],
    thermalSignature: {
      temp: 'Varies — warm-blooded animals are easier to detect',
      bestTime: 'Night is generally best for thermal detection of warm-blooded animals',
      tips: 'Ask the owner about the animal\'s body temperature and behavior. Warm-blooded pets show clearly on thermal at night.',
    },
    searchStrategy: {
      day1: 'Start with a tight grid around the escape point. Most pets stay within a small radius initially.',
      day2: 'Expand the grid based on owner input and species behavior. Night thermal flights recommended.',
      day3plus: 'Continue expanding. Post in local lost pet groups and community pages.',
    },
    timeBehavior: 'Varies by species. Consult with the owner for specific behavior patterns.',
  },
};

/**
 * Get the search profile for a pet type
 */
export function getPetProfile(petType) {
  return PET_PROFILES[petType] || PET_PROFILES.other;
}

/**
 * Get recommended search radius in miles based on pet type and hours missing
 */
export function getRecommendedRadius(petType, hoursMissing, temperament = 'unknown') {
  const profile = PET_PROFILES[petType] || PET_PROFILES.other;
  
  const radiusMap = {
    dog: { friendly: [1, 3, 5], skittish: [0.5, 2, 3], aggressive: [0.25, 1, 2], unknown: [1, 3, 5] },
    cat: { friendly: [0.1, 0.2, 0.3], skittish: [0.05, 0.1, 0.2], aggressive: [0.03, 0.08, 0.15], unknown: [0.1, 0.2, 0.3] },
    horse: { friendly: [2, 5, 10], skittish: [1, 3, 5], aggressive: [0.5, 1, 2], unknown: [2, 5, 10] },
    bird: { friendly: [0.1, 0.25, 0.5], skittish: [0.25, 0.5, 1], aggressive: [0.1, 0.15, 0.2], unknown: [0.2, 0.4, 0.8] },
    rabbit: { friendly: [0.03, 0.05, 0.1], skittish: [0.02, 0.03, 0.05], aggressive: [0.02, 0.03, 0.05], unknown: [0.03, 0.05, 0.1] },
    reptile: { friendly: [0.02, 0.03, 0.05], skittish: [0.01, 0.02, 0.03], aggressive: [0.01, 0.02, 0.03], unknown: [0.02, 0.03, 0.05] },
    other: { friendly: [0.5, 1, 2], skittish: [0.25, 0.5, 1], aggressive: [0.1, 0.25, 0.5], unknown: [0.5, 1, 2] },
  };

  const radii = radiusMap[petType]?.[temperament] || radiusMap.other.unknown;
  
  if (hoursMissing <= 24) return radii[0];
  if (hoursMissing <= 48) return radii[1];
  return radii[2];
}

/**
 * Get optimal flight time recommendation
 */
export function getOptimalFlightTime(petType) {
  const profile = PET_PROFILES[petType] || PET_PROFILES.other;
  return profile.thermalSignature.bestTime;
}
