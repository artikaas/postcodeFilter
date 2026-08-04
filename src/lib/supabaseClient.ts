import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ontbreken. ' +
      'Kopieer .env.example naar .env en vul je Supabase-projectgegevens in ' +
      '(lokaal), of zet ze in de Vercel-projectinstellingen en redeploy ' +
      '(productie/preview). Vite bakt deze waarden in tijdens de build, dus ' +
      'ze achteraf toevoegen zonder opnieuw te builden heeft geen effect.'
  );
}

// createClient gooit synchroon een fout bij een lege URL, wat de hele app
// laat crashen vóór React kan renderen (een wit scherm zonder zichtbare
// oorzaak). Val daarom terug op een geldig-uitziende placeholder: de app
// rendert dan gewoon door en toont de bestaande foutmelding uit
// useInitiativeSearch zodra de eerste (mislukte) Supabase-call terugkomt.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-anon-key'
);
