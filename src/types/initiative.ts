export type InitiativeCategory =
  | 'gezelschap'
  | 'spelletjes'
  | 'koffie'
  | 'bingo'
  | 'anders';

export interface Initiative {
  id: string;
  name: string;
  description: string;
  category: InitiativeCategory;
  address: string | null;
  postcode: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  source_url: string | null;
  image_url: string | null;
  created_at: string;
  /** Only present when a postcode search was performed (result of the nearby_initiatives RPC). */
  distance_km?: number;
}

export const CATEGORY_LABELS: Record<InitiativeCategory, string> = {
  gezelschap: 'Gezelschap',
  spelletjes: 'Spelletjes',
  koffie: 'Koffie drinken',
  bingo: 'Bingo',
  anders: 'Overig',
};
