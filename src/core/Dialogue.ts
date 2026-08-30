import { randomChoice } from '../utils/math.ts';

/**
 * All the Bangalore flavour text in one place — transliterated Kannada the way
 * it actually gets typed in the city, not formal script. Every line here is
 * something you could plausibly hear shouted on a Sarjapur Road evening.
 */

/** Auto Anna's lines when he cuts Nitesh off and lifts his cash. */
export const AUTO_ANNA_LINES = [
  'Swalpa adjust maadi!',
  'Meter haaki illa, guru!',
  'One and half, sir!',
  'Yaake illi nintiddiya?',
  'Double charge, boss!',
  'Bega bega, late aagide!',
  'Sarjapur? Two hundred extra!',
] as const;

/** Shouted from behind a steering wheel when a cab clips him. */
export const CAB_HIT_LINES = [
  'Nodkondu hogi!',
  'Ayyo! Kannu illva?',
  'Side bidi, guru!',
  'Enu maadtiddiya macha?',
] as const;

/** The bus does not apologise. */
export const BUS_LINES = [
  'BMTC BANTHU!',
  'SIDE BIDI!',
  'BUS NILLISODILLA!',
] as const;

/** A bus barrelling the wrong way up the lane. */
export const WRONG_WAY_LINES = [
  'WRONG SIDE BUS!',
  'ULTA BANDA!',
  'AYYO WRONG ROUTE!',
] as const;

/** Horn onomatopoeia. Bangalore horns are not polite. */
export const HONK_SOUNDS = ['PON PON!', 'HORN!', 'PEEEEP!', 'HAAAAN!', 'BEEP BEEP!'] as const;

/** Good street food. */
export const FOOD_BLESSING_LINES = [
  'Sakkath filter coffee, guru!',
  'Bombat biryani!',
  'Chennagide! Tale clear aaytu.',
  'Aha! Sakkath taste.',
] as const;

/** Bad street food. */
export const FOOD_CURSE_LINES = [
  'Ayyo! Hotte kettoytu!',
  '🤢 Food poisoning, guru!',
  'Bejaar! Tummy upset.',
] as const;

/** Shown while the noise meter is pinned. */
export const STRESS_LINES = [
  'TALE KETTOYTU! Get out of the traffic!',
  'HORN JAASTI! Sanity hogtaa ide!',
  'SAAKAGIDE! Move, guru!',
] as const;

export const STORY_TITLE = 'Kelsa mugithu. Mane seri, guru.';

/** Beat-by-beat intro, shown one line at a time before the run. */
export const STORY_BEATS: readonly { text: string; note?: string }[] = [
  {
    text: 'Nitesh works at Mayta, in the tech park off Sarjapur Road.',
    note: 'Eight years. Same desk. Same 9 PM logout.',
  },
  {
    text: 'Today he resigned.',
    note: 'Last laptop handover done. Badge dropped at reception.',
  },
  {
    text: 'His flat is in HSR Layout. 1,500 metres away.',
    note: 'On a normal day, a fifteen minute walk.',
  },
  {
    text: 'But it is 6:40 PM on a weekday, and this is Bangalore.',
    note: 'Sarjapur Road has not moved in forty minutes.',
  },
  {
    text: 'Between him and home: eight lanes of horn, Auto Annas hunting a fare, BMTC buses that stop for nobody, and metro work that ate half the road.',
  },
  {
    text: 'Nadi, Nitesh. Mane seri.',
    note: 'Walk, Nitesh. Get home.',
  },
];

export const WIN_LINES = {
  title: 'MANE SERIDE!',
  sub: 'Nitesh made it to HSR Layout. Kelsa illa, but mane ideyalla.',
} as const;

export const LOSE_LINES = {
  health: {
    title: 'AYYO DEVARE!',
    sub: 'The traffic won. Nitesh did not make it home.',
  },
  sanity: {
    title: 'TALE KETTOYTU!',
    sub: 'The honking broke him. Sanity hit zero somewhere in the gridlock.',
  },
} as const;

export function randomLine(lines: readonly string[]): string {
  return randomChoice(lines);
}
