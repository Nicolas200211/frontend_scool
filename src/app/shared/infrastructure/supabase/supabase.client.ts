import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

let instancia: SupabaseClient | null = null;

export function obtenerClienteSupabase(): SupabaseClient {
  if (!instancia) {
    instancia = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }
  return instancia;
}
