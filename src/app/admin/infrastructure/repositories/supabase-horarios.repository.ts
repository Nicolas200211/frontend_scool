import { Injectable } from '@angular/core';
import { HorariosRepository } from '../../core/domain/ports/horarios.repository';
import { Horario, CrearHorarioDto } from '../../core/domain/models/horario.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

const QUERY = `
  *,
  secciones(nombre, grados(nombre)),
  asignaturas(nombre),
  docentes(usuarios(nombre, apellido))
`;

@Injectable({ providedIn: 'root' })
export class SupabaseHorariosRepository implements HorariosRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodos(): Promise<RespuestaApi<Horario[]>> {
    const { data, error } = await this.supabase.from('horarios').select(QUERY).order('dia_semana');
    if (error) return { datos: null, error: error.message };
    return { datos: (data ?? []).map(this.mapear), error: null };
  }

  async crear(dto: CrearHorarioDto): Promise<RespuestaApi<Horario>> {
    const { data, error } = await this.supabase
      .from('horarios').insert({
        seccion_id: dto.seccionId, asignatura_id: dto.asignaturaId, docente_id: dto.docenteId,
        dia_semana: dto.diaSemana, hora_inicio: dto.horaInicio, hora_fin: dto.horaFin,
      }).select(QUERY).single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async actualizar(id: string, dto: Partial<CrearHorarioDto>): Promise<RespuestaApi<Horario>> {
    const { data, error } = await this.supabase
      .from('horarios').update({
        seccion_id: dto.seccionId, asignatura_id: dto.asignaturaId, docente_id: dto.docenteId,
        dia_semana: dto.diaSemana, hora_inicio: dto.horaInicio, hora_fin: dto.horaFin,
      }).eq('id', id).select(QUERY).single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('horarios').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  private mapear(r: any): Horario {
    return {
      id: r.id, seccionId: r.seccion_id, asignaturaId: r.asignatura_id, docenteId: r.docente_id,
      diaSemana: r.dia_semana, horaInicio: r.hora_inicio, horaFin: r.hora_fin,
      seccionNombre: r.secciones?.nombre ?? '',
      gradoNombre: r.secciones?.grados?.nombre ?? '',
      asignaturaNombre: r.asignaturas?.nombre ?? '',
      docenteNombre: `${r.docentes?.usuarios?.nombre ?? ''} ${r.docentes?.usuarios?.apellido ?? ''}`.trim(),
      creadoEn: r.creado_en,
    };
  }
}
