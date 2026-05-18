import { Injectable } from '@angular/core';
import { MatriculasRepository } from '../../core/domain/ports/matriculas.repository';
import { Matricula, CrearMatriculaDto } from '../../core/domain/models/matricula.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

const QUERY = `*, estudiantes(codigo, usuarios(nombre, apellido, foto_url)), secciones(nombre, grados(nombre))`;

@Injectable({ providedIn: 'root' })
export class SupabaseMatriculasRepository implements MatriculasRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodas(): Promise<RespuestaApi<Matricula[]>> {
    const { data, error } = await this.supabase.from('matriculas').select(QUERY).order('creado_en', { ascending: false });
    if (error) return { datos: null, error: error.message };
    return { datos: (data ?? []).map(this.mapear), error: null };
  }

  async crear(dto: CrearMatriculaDto): Promise<RespuestaApi<Matricula>> {
    const { data, error } = await this.supabase
      .from('matriculas').insert({
        estudiante_id: dto.estudianteId, seccion_id: dto.seccionId,
        anio_academico: dto.anioAcademico, estado: dto.estado,
      }).select(QUERY).single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async actualizar(id: string, dto: Partial<CrearMatriculaDto>): Promise<RespuestaApi<Matricula>> {
    const { data, error } = await this.supabase
      .from('matriculas').update({ estado: dto.estado, seccion_id: dto.seccionId })
      .eq('id', id).select(QUERY).single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('matriculas').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  private mapear(r: any): Matricula {
    return {
      id: r.id, estudianteId: r.estudiante_id, seccionId: r.seccion_id,
      anioAcademico: r.anio_academico, estado: r.estado,
      estudianteCodigo: r.estudiantes?.codigo ?? '',
      estudianteNombre: r.estudiantes?.usuarios?.nombre ?? '',
      estudianteApellido: r.estudiantes?.usuarios?.apellido ?? '',
      estudianteFotoUrl: r.estudiantes?.usuarios?.foto_url || r.estudiantes?.usuarios?.fotoUrl || null,
      seccionNombre: r.secciones?.nombre ?? '',
      gradoNombre: r.secciones?.grados?.nombre ?? '',
      creadoEn: r.creado_en,
    };
  }
}
