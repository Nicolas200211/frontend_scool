import { Injectable } from '@angular/core';
import { JustificacionesRepository } from '../../core/domain/ports/justificaciones.repository';
import { Justificacion } from '../../core/domain/models/justificacion.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

const QUERY = `
  id, asistencia_id, apoderado_id, motivo, archivo_url, estado, creado_en,
  asistencia(fecha, horarios(asignaturas(nombre)), matriculas(estudiantes(usuarios(nombre, apellido)))),
  apoderados(usuarios(nombre))
`;

@Injectable({ providedIn: 'root' })
export class SupabaseJustificacionesRepository implements JustificacionesRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodas(): Promise<RespuestaApi<Justificacion[]>> {
    const { data, error } = await this.supabase
      .from('justificaciones').select(QUERY).order('creado_en', { ascending: false });

    if (error) return { datos: null, error: error.message };

    const registros: Justificacion[] = (data ?? []).map((r: any) => ({
      id: r.id,
      asistenciaId: r.asistencia_id,
      apoderadoId: r.apoderado_id,
      motivo: r.motivo,
      archivoUrl: r.archivo_url,
      estado: r.estado,
      creadoEn: r.creado_en,
      fecha: r.asistencia?.fecha ?? '',
      asignaturaNombre: r.asistencia?.horarios?.asignaturas?.nombre ?? '',
      estudianteNombre: r.asistencia?.matriculas?.estudiantes?.usuarios?.nombre ?? '',
      estudianteApellido: r.asistencia?.matriculas?.estudiantes?.usuarios?.apellido ?? '',
      apoderadoNombre: r.apoderados?.usuarios?.nombre ?? '',
    }));

    return { datos: registros, error: null };
  }

  async obtenerPorDocente(docenteId: string): Promise<RespuestaApi<Justificacion[]>> {
    const { data: horarios } = await this.supabase
      .from('horarios').select('id').eq('docente_id', docenteId);

    const horarioIds = (horarios ?? []).map((h: any) => h.id);
    if (horarioIds.length === 0) return { datos: [], error: null };

    const { data: asistencias } = await this.supabase
      .from('asistencia').select('id').in('horario_id', horarioIds);

    const asistenciaIds = (asistencias ?? []).map((a: any) => a.id);
    if (asistenciaIds.length === 0) return { datos: [], error: null };

    const { data, error } = await this.supabase
      .from('justificaciones').select(QUERY)
      .in('asistencia_id', asistenciaIds)
      .order('creado_en', { ascending: false });

    if (error) return { datos: null, error: error.message };

    const registros: Justificacion[] = (data ?? []).map((r: any) => ({
      id: r.id,
      asistenciaId: r.asistencia_id,
      apoderadoId: r.apoderado_id,
      motivo: r.motivo,
      archivoUrl: r.archivo_url,
      estado: r.estado,
      creadoEn: r.creado_en,
      fecha: r.asistencia?.fecha ?? '',
      asignaturaNombre: r.asistencia?.horarios?.asignaturas?.nombre ?? '',
      estudianteNombre: r.asistencia?.matriculas?.estudiantes?.usuarios?.nombre ?? '',
      estudianteApellido: r.asistencia?.matriculas?.estudiantes?.usuarios?.apellido ?? '',
      apoderadoNombre: r.apoderados?.usuarios?.nombre ?? '',
    }));

    return { datos: registros, error: null };
  }

  async actualizarEstado(id: string, estado: 'aprobado' | 'rechazado'): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase
      .from('justificaciones').update({ estado, revisado_en: new Date().toISOString() }).eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }
}
