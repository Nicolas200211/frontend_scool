import { Injectable } from '@angular/core';
import { AsignaturasRepository } from '../../core/domain/ports/asignaturas.repository';
import { Asignatura, CrearAsignaturaDto } from '../../core/domain/models/asignatura.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAsignaturasRepository implements AsignaturasRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodas(): Promise<RespuestaApi<Asignatura[]>> {
    const { data, error } = await this.supabase.from('asignaturas').select('*').order('nombre');
    if (error) return { datos: null, error: error.message };
    return { datos: (data ?? []).map(this.mapear), error: null };
  }

  async crear(dto: CrearAsignaturaDto): Promise<RespuestaApi<Asignatura>> {
    const { data, error } = await this.supabase
      .from('asignaturas').insert({ nombre: dto.nombre, codigo: dto.codigo, descripcion: dto.descripcion ?? null })
      .select().single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async actualizar(id: string, dto: Partial<CrearAsignaturaDto>): Promise<RespuestaApi<Asignatura>> {
    const { data, error } = await this.supabase
      .from('asignaturas').update({ nombre: dto.nombre, codigo: dto.codigo, descripcion: dto.descripcion })
      .eq('id', id).select().single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('asignaturas').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  private mapear(r: any): Asignatura {
    return { id: r.id, nombre: r.nombre, codigo: r.codigo, descripcion: r.descripcion, creadoEn: r.creado_en };
  }
}
