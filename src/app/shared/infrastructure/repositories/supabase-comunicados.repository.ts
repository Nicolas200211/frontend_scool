import { Injectable } from '@angular/core';
import { ComunicadosRepository } from '../../domain/ports/comunicados.repository';
import { Comunicado } from '../../domain/models/comunicado.model';
import { RespuestaApi } from '../../domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseComunicadosRepository implements ComunicadosRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerPorAudiencia(audiencia: string): Promise<RespuestaApi<Comunicado[]>> {
    let query = this.supabase
      .from('comunicados')
      .select('*')
      .order('creado_en', { ascending: false });

    if (audiencia !== 'admin') {
      // Admin sees everything, otherwise filter by specific audience or 'todos'
      query = query.in('audiencia', [audiencia, 'todos']);
    }

    const { data, error } = await query;
    if (error) return { datos: null, error: error.message };

    const registros: Comunicado[] = (data ?? []).map((c: any) => ({
      id: c.id,
      audiencia: c.audiencia,
      importancia: c.importancia,
      titulo: c.titulo,
      mensaje: c.mensaje,
      creadoEn: c.creado_en,
    }));

    return { datos: registros, error: null };
  }

  async crear(comunicado: Omit<Comunicado, 'id' | 'creadoEn'>): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase
      .from('comunicados')
      .insert([comunicado]);

    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }
}
