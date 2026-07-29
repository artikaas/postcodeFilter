import type { Initiative, InitiativeCategory } from '../types/initiative';

export interface CategoryImage {
  /**
   * Directe hotlink (images.unsplash.com/...). Staat nu leeg: onze fetch-
   * tools worden door Unsplash's botbescherming geblokkeerd, dus we konden
   * de exacte CDN-URL niet zelf verifiëren. Vul 'm in via de sourceUrl
   * hieronder: open die pagina, rechtsklik op de foto -> "Afbeeldingsadres
   * kopiëren" -> plak die link hier. Zolang dit leeg is valt de kaart
   * automatisch terug op de emoji/kleurvlak-placeholder (zie InitiativeCard).
   */
  url: string;
  /** Naam van de fotograaf, voor eigen administratie/attributie. */
  credit: string;
  /** Originele Unsplash-pagina: hier check je ook de licentie (moet
   * "Unsplash License" zijn, niet het betaalde "Unsplash+") voordat dit
   * client-facing gaat. */
  sourceUrl: string;
}

// Handmatig gecureerd per categorie zodat de foto's inhoudelijk passen.
// Uitgesloten: alles wat bij het zoeken als "Unsplash+"/Getty Images naar
// voren kwam, dat is een betaalde licentie, geen vrije Unsplash License.
export const CATEGORY_IMAGES: Record<InitiativeCategory, CategoryImage[]> = {
  gezelschap: [
    {
      url: '',
      credit: 'Tim Mossholder',
      sourceUrl:
        'https://unsplash.com/photos/two-elderly-people-sitting-on-a-bench-in-a-park-es2H0Wtscjg',
    },
    {
      url: '',
      credit: 'Tim Mossholder',
      sourceUrl:
        'https://unsplash.com/photos/an-older-couple-sitting-on-a-bench-in-a-park-tr00xd2YKrw',
    },
  ],
  spelletjes: [
    {
      url: '',
      credit: 'Joey Huang',
      sourceUrl:
        'https://unsplash.com/photos/a-group-of-elderly-people-playing-a-game-of-cards-w7lIbEtmE9c',
    },
    {
      url: '',
      credit: 'controleer fotograaf/licentie op Unsplash',
      sourceUrl: 'https://unsplash.com/photos/two-people-playing-a-board-game-on-a-table-43AGGcjA5tA',
    },
  ],
  koffie: [
    {
      url: '',
      credit: 'Yunus Tuğ',
      sourceUrl: 'https://unsplash.com/photos/two-elderly-men-are-enjoying-coffee-together-i108Hir_sY0',
    },
    {
      url: '',
      credit: 'Elena Helade',
      sourceUrl: 'https://unsplash.com/photos/two-elderly-people-toast-with-coffee-mugs-LD2uCScyaQM',
    },
  ],
  bingo: [
    {
      url: '',
      credit: 'controleer fotograaf/licentie op Unsplash',
      sourceUrl: 'https://unsplash.com/photos/bingo-card-with-some-accompanying-items-z0ENlNNGjtM',
    },
    {
      url: '',
      credit: 'controleer fotograaf/licentie op Unsplash',
      sourceUrl:
        'https://unsplash.com/photos/a-row-of-colorful-balls-with-numbers-on-them-_8whI559EyI',
    },
  ],
  anders: [
    {
      url: '',
      credit: 'controleer fotograaf/licentie op Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-group-of-people-talking-bxiOjnbjRM0',
    },
    {
      url: '',
      credit: 'controleer fotograaf/licentie op Unsplash',
      sourceUrl: 'https://unsplash.com/photos/a-group-of-people-standing-around-each-other-sHd-Daj27V0',
    },
  ],
};

/** Deterministisch: hetzelfde initiatief toont altijd dezelfde foto uit de pool. */
export function pickCategoryImage(initiative: Initiative): CategoryImage | null {
  const pool = CATEGORY_IMAGES[initiative.category];
  if (!pool || pool.length === 0) return null;

  let hash = 0;
  for (let i = 0; i < initiative.id.length; i += 1) {
    hash = (hash * 31 + initiative.id.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}
