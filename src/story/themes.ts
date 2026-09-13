/**
 * The six Themes' vocabularies: the closed set of words a Story may use.
 * Every Story is checked against its Theme's words plus the core words
 * every Theme shares; a word outside the set fails the Story. No number
 * words anywhere: the numbers are written as digits so the validator can
 * see that they are exactly the engine's.
 */
import type { ThemeId } from "@/profile/identity";

/** A countable thing in a Theme, in both numbers, so a template never says "1 bones". */
export type Thing = { readonly one: string; readonly many: string };

export type ThemeVocabulary = {
  readonly id: ThemeId;
  /** The things the Theme counts. The first is what the template sentence counts. */
  readonly things: readonly Thing[];
  /** Where the Theme happens, as the rich template says it: "at the park". Its words are the Theme's own. */
  readonly where: string;
  /** Everything else the Theme lets a Story say, beyond the core words. */
  readonly words: readonly string[];
};

const split = (text: string): readonly string[] => text.trim().split(/\s+/);

/** Grade 1 words every Theme shares: people, actions, places in time, and the question. */
export const CORE_WORDS: readonly string[] = split(`
  a an and are all along also at away back be big both but by
  can come comes came coming count counts day did do does down each
  find finds found for friend friends from fun get gets got give gives gave
  go goes going went gone had has have he her here hers him his home how
  in into is it its join joins joined jump jumps jumped keep keeps kept
  last left let little look looks looked lost lot lots make makes made many
  more morning most my need needs new next night no not now of off on only other our out over
  play plays played put puts ran run runs runs see sees saw she sit sits sat so some soon still
  take takes took than that the their them then there these they this those to today together too
  up us very want wants was we were what when where while who will with yes you your
  altogether bring brings brought eat eats ate happy hide hides hid hungry line rest sleep sleeps slept
  small stay stays stayed tall thing things wait waits waited walk walks walked watch watches watched
`);

const THEME_VOCABULARIES: readonly ThemeVocabulary[] = [
  {
    id: "puppies",
    where: "at the park",
    things: [{ one: "puppy", many: "puppies" }, { one: "bone", many: "bones" }],
    words: split(`
      puppy puppies dog dogs bone bones ball balls park yard bark barks barked wag wags wagged
      tail tails dig digs dug fetch fetches fetched treat treats leash bowl bowls nap naps mud muddy
      fluffy paw paws bed beds chew chews chewed toy toys blanket blankets
    `),
  },
  {
    id: "dinosaurs",
    where: "in the jungle",
    things: [{ one: "dinosaur", many: "dinosaurs" }, { one: "egg", many: "eggs" }],
    words: split(`
      dinosaur dinosaurs dino dinos egg eggs nest nests roar roars roared stomp stomps stomped
      leaf leaves tree trees cave caves tail tails volcano jungle bone bones fern ferns
      hatch hatches hatched spike spikes giant tiny river rock rocks footprint footprints
    `),
  },
  {
    id: "space",
    where: "on the moon",
    things: [{ one: "rocket", many: "rockets" }, { one: "star", many: "stars" }],
    words: split(`
      rocket rockets star stars moon moons planet planets ship ships astronaut astronauts
      alien aliens comet comets robot robots zoom zooms zoomed blast blasts blasted orbit orbits
      launch launches launched land lands landed shiny glow glows sky space crater craters
      helmet helmets float floats floated
    `),
  },
  {
    id: "ocean",
    where: "at the beach",
    things: [{ one: "fish", many: "fish" }, { one: "shell", many: "shells" }],
    words: split(`
      fish crab crabs shell shells wave waves whale whales dolphin dolphins turtle turtles
      starfish boat boats sand beach reef sea ocean splash splashes splashed swim swims swam
      dive dives dived bubble bubbles octopus seal seals pearl pearls net nets water rock rocks
    `),
  },
  {
    id: "fairies",
    where: "in the garden",
    things: [{ one: "fairy", many: "fairies" }, { one: "flower", many: "flowers" }],
    words: split(`
      fairy fairies wing wings wand wands flower flowers garden gardens sparkle sparkles sparkled
      glitter mushroom mushrooms petal petals dew drop drops butterfly butterflies pixie pixies
      magic spell spells crown crowns lantern lanterns dance dances danced twinkle twinkles
      fly flies flew tree trees pond
    `),
  },
  {
    id: "trucks",
    where: "at the site",
    things: [{ one: "truck", many: "trucks" }, { one: "rock", many: "rocks" }],
    words: split(`
      truck trucks wheel wheels load loads loaded dump dumps dumped digger diggers crane cranes
      rock rocks dirt road roads box boxes crate crates honk honks honked beep beeps beeped
      garage tow tows towed bucket buckets log logs mixer mixers site drive drives drove
      park parks parked
    `),
  },
];

export function themeVocabulary(theme: ThemeId): ThemeVocabulary {
  const vocabulary = THEME_VOCABULARIES.find((t) => t.id === theme);
  if (!vocabulary) throw new Error(`Unknown Theme: ${theme}`);
  return vocabulary;
}

/** Every word a Story in this Theme may use, lower case. */
export function allowedWords(theme: ThemeId): ReadonlySet<string> {
  const { things, words } = themeVocabulary(theme);
  return new Set([...CORE_WORDS, ...things.flatMap((t) => [t.one, t.many]), ...words]);
}
