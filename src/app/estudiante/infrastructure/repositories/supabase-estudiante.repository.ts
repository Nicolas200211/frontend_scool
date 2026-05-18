import { Injectable } from '@angular/core';
import { EstudianteRepository } from '../../core/domain/ports/estudiante.repository';
import { MiAsistencia } from '../../core/domain/models/mi-asistencia.model';
import { MiHorario } from '../../core/domain/models/mi-horario.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseEstudianteRepository implements EstudianteRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerEstudianteId(usuarioId: string): Promise<string | null> {
    const { data } = await this.supabase.from('estudiantes').select('id').eq('usuario_id', usuarioId).single();
    return data?.id ?? null;
  }

  async obtenerMatriculaActiva(estudianteId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('matriculas').select('seccion_id').eq('estudiante_id', estudianteId).eq('estado', 'activo').single();
    return data?.seccion_id ?? null;
  }

  async obtenerMiAsistencia(estudianteId: string, fechaDesde: string, fechaHasta: string): Promise<RespuestaApi<MiAsistencia[]>> {
    const { data: matriculas } = await this.supabase
      .from('matriculas').select('id').eq('estudiante_id', estudianteId);

    const matriculaIds = (matriculas ?? []).map((m: any) => m.id);
    if (matriculaIds.length === 0) return { datos: [], error: null };

    const { data, error } = await this.supabase
      .from('asistencia')
      .select(`
        id, fecha, estado, observacion,
        horarios(hora_inicio, hora_fin, asignaturas(nombre), secciones(nombre, grados(nombre)))
      `)
      .in('matricula_id', matriculaIds)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: false });

    if (error) return { datos: null, error: error.message };

    const registros: MiAsistencia[] = (data ?? []).map((r: any) => ({
      id: r.id,
      fecha: r.fecha,
      estado: r.estado,
      observacion: r.observacion,
      asignaturaNombre: r.horarios?.asignaturas?.nombre ?? '',
      horaInicio: r.horarios?.hora_inicio ?? '',
      horaFin: r.horarios?.hora_fin ?? '',
      seccionNombre: r.horarios?.secciones?.nombre ?? '',
      gradoNombre: r.horarios?.secciones?.grados?.nombre ?? '',
    }));

    return { datos: registros, error: null };
  }

  async obtenerMiHorario(estudianteId: string): Promise<RespuestaApi<MiHorario[]>> {
    const { data: matricula } = await this.supabase
      .from('matriculas').select('seccion_id').eq('estudiante_id', estudianteId).eq('estado', 'activo').single();

    if (!matricula) return { datos: [], error: null };

    const { data, error } = await this.supabase
      .from('horarios')
      .select(`
        id, dia_semana, hora_inicio, hora_fin,
        asignaturas(nombre),
        secciones(nombre, grados(nombre)),
        docentes(usuarios(nombre, apellido))
      `)
      .eq('seccion_id', matricula.seccion_id)
      .order('dia_semana')
      .order('hora_inicio');

    if (error) return { datos: null, error: error.message };

    const registros: MiHorario[] = (data ?? []).map((h: any) => ({
      id: h.id,
      diaSemana: h.dia_semana,
      horaInicio: h.hora_inicio,
      horaFin: h.hora_fin,
      asignaturaNombre: h.asignaturas?.nombre ?? '',
      docenteNombre: h.docentes?.usuarios?.nombre ?? '',
      docenteApellido: h.docentes?.usuarios?.apellido ?? '',
      seccionNombre: h.secciones?.nombre ?? '',
      gradoNombre: h.secciones?.grados?.nombre ?? '',
    }));

    return { datos: registros, error: null };
  }
}
