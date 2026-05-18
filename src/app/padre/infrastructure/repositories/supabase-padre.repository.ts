import { Injectable } from '@angular/core';
import { PadreRepository } from '../../core/domain/ports/padre.repository';
import { AsistenciaHijo } from '../../core/domain/models/asistencia-hijo.model';
import { HijoInfo } from '../../core/domain/models/hijo-info.model';
import { Justificacion, EnviarJustificacionDto } from '../../core/domain/models/justificacion.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabasePadreRepository implements PadreRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerHijos(usuarioId: string): Promise<RespuestaApi<HijoInfo[]>> {
    const { data, error } = await this.supabase
      .from('apoderados')
      .select('id, estudiante_id, parentesco, estudiantes(codigo, usuarios(nombre, apellido))')
      .eq('usuario_id', usuarioId);

    if (error) return { datos: null, error: error.message };

    const hijos: HijoInfo[] = (data ?? []).map((r: any) => ({
      apoderadoId: r.id,
      estudianteId: r.estudiante_id,
      estudianteNombre: r.estudiantes?.usuarios?.nombre ?? '',
      estudianteApellido: r.estudiantes?.usuarios?.apellido ?? '',
      estudianteCodigo: r.estudiantes?.codigo ?? '',
      parentesco: r.parentesco,
    }));

    return { datos: hijos, error: null };
  }

  async obtenerAsistenciaHijo(estudianteId: string, fechaDesde: string, fechaHasta: string): Promise<RespuestaApi<AsistenciaHijo[]>> {
    const { data: matriculas, error: errorMatricula } = await this.supabase
      .from('matriculas')
      .select('id')
      .eq('estudiante_id', estudianteId);

    if (errorMatricula) return { datos: null, error: errorMatricula.message };
    if (!matriculas || matriculas.length === 0) return { datos: [], error: null };

    const matriculaIds = (matriculas as { id: string }[]).map((m) => m.id);

    const { data, error } = await this.supabase
      .from('asistencia')
      .select(`
        id, fecha, estado, observacion,
        horarios(hora_inicio, hora_fin, asignaturas(nombre), secciones(nombre, grados(nombre))),
        justificaciones(id)
      `)
      .in('matricula_id', matriculaIds)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: false });

    if (error) return { datos: null, error: error.message };

    const registros: AsistenciaHijo[] = (data ?? []).map((r: any) => ({
      id: r.id,
      asistenciaId: r.id,
      fecha: r.fecha,
      estado: r.estado,
      observacion: r.observacion,
      asignaturaNombre: r.horarios?.asignaturas?.nombre ?? '',
      horaInicio: r.horarios?.hora_inicio ?? '',
      horaFin: r.horarios?.hora_fin ?? '',
      seccionNombre: r.horarios?.secciones?.nombre ?? '',
      gradoNombre: r.horarios?.secciones?.grados?.nombre ?? '',
      tieneJustificacion: (r.justificaciones ?? []).length > 0,
    }));

    return { datos: registros, error: null };
  }

  async obtenerJustificaciones(apoderadoId: string): Promise<RespuestaApi<Justificacion[]>> {
    const { data, error } = await this.supabase
      .from('justificaciones')
      .select(`
        id, asistencia_id, apoderado_id, motivo, archivo_url, estado, creado_en,
        asistencia(fecha, horarios(asignaturas(nombre)))
      `)
      .eq('apoderado_id', apoderadoId)
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
    }));

    return { datos: registros, error: null };
  }

  async enviarJustificacion(dto: EnviarJustificacionDto): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('justificaciones').insert({
      asistencia_id: dto.asistenciaId,
      apoderado_id: dto.apoderadoId,
      motivo: dto.motivo,
    });
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }
}
