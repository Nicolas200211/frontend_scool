import { Injectable } from '@angular/core';
import { AsistenciaRepository } from '../../core/domain/ports/asistencia.repository';
import { HorarioHoy, RegistrarAsistenciaDto, RegistroAsistencia, RegistroAsistenciaAdmin, ResumenAsistencia } from '../../core/domain/models/asistencia.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseAsistenciaRepository implements AsistenciaRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerIdDocente(usuarioId: string): Promise<string | null> {
    const { data } = await this.supabase.from('docentes').select('id').eq('usuario_id', usuarioId).single();
    return data?.id ?? null;
  }

  async obtenerHorariosHoy(docenteId: string, fecha: string): Promise<RespuestaApi<HorarioHoy[]>> {
    const diaSemana = this.obtenerDiaSemana(fecha);
    const { data, error } = await this.supabase
      .from('horarios')
      .select('id, seccion_id, hora_inicio, hora_fin, asignaturas(nombre), secciones(nombre, grados(nombre))')
      .eq('docente_id', docenteId)
      .eq('dia_semana', diaSemana);

    if (error) return { datos: null, error: error.message };

    const horarios: HorarioHoy[] = await Promise.all(
      (data ?? []).map(async (h: any) => {
        const { count } = await this.supabase
          .from('asistencia')
          .select('id', { count: 'exact', head: true })
          .eq('horario_id', h.id)
          .eq('fecha', fecha);
        return {
          id: h.id, seccionId: h.seccion_id,
          asignaturaNombre: h.asignaturas?.nombre ?? '',
          seccionNombre: h.secciones?.nombre ?? '',
          gradoNombre: h.secciones?.grados?.nombre ?? '',
          horaInicio: h.hora_inicio, horaFin: h.hora_fin,
          asistenciaTomada: (count ?? 0) > 0,
        };
      })
    );

    return { datos: horarios.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)), error: null };
  }

  async obtenerListaAsistencia(horarioId: string, fecha: string): Promise<RespuestaApi<RegistroAsistencia[]>> {
    const { data: matriculas, error } = await this.supabase
      .from('matriculas')
      .select(`
        id, estudiantes(codigo, usuarios(nombre, apellido, foto_url)),
        asistencia(id, estado, observacion)
      `)
      .eq('estado', 'activo')
      .filter('asistencia.horario_id', 'eq', horarioId)
      .filter('asistencia.fecha', 'eq', fecha);

    if (error) return { datos: null, error: error.message };

    const registros: RegistroAsistencia[] = (matriculas ?? []).map((m: any) => {
      const asistenciaHoy = (m.asistencia ?? []).find((a: any) => true) ?? null;
      return {
        matriculaId: m.id,
        estudianteCodigo: m.estudiantes?.codigo ?? '',
        estudianteNombre: m.estudiantes?.usuarios?.nombre ?? '',
        estudianteApellido: m.estudiantes?.usuarios?.apellido ?? '',
        estado: asistenciaHoy?.estado ?? null,
        observacion: asistenciaHoy?.observacion ?? null,
        asistenciaId: asistenciaHoy?.id ?? null,
        fotoUrl: m.estudiantes?.usuarios?.foto_url ?? null,
      };
    });

    return { datos: registros.sort((a, b) => a.estudianteApellido.localeCompare(b.estudianteApellido)), error: null };
  }

  async guardarAsistencia(registros: RegistrarAsistenciaDto[]): Promise<RespuestaApi<void>> {
    if (registros.length === 0) return { datos: undefined, error: null };
    const horarioId = registros[0].horarioId;
    const fecha = registros[0].fecha;

    const { error: deleteError } = await this.supabase
      .from('asistencia').delete().eq('horario_id', horarioId).eq('fecha', fecha);
    if (deleteError) return { datos: null, error: deleteError.message };

    const { error } = await this.supabase.from('asistencia').insert(
      registros.map((r) => ({
        matricula_id: r.matriculaId, horario_id: r.horarioId,
        fecha: r.fecha, estado: r.estado, observacion: r.observacion ?? null,
      }))
    );
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  async obtenerRegistrosAdmin(fechaDesde: string, fechaHasta: string, seccionId?: string): Promise<RespuestaApi<RegistroAsistenciaAdmin[]>> {
    let query = this.supabase
      .from('asistencia')
      .select(`
        id, fecha, estado, observacion,
        horarios(hora_inicio, hora_fin, asignaturas(nombre), secciones(nombre, grados(nombre))),
        matriculas(estudiantes(codigo, usuarios(nombre, apellido)))
      `)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: false });

    if (seccionId) {
      query = query.eq('horarios.seccion_id', seccionId) as typeof query;
    }

    const { data, error } = await query;
    if (error) return { datos: null, error: error.message };

    const registros: RegistroAsistenciaAdmin[] = (data ?? []).map((r: any) => ({
      id: r.id,
      fecha: r.fecha,
      estado: r.estado,
      observacion: r.observacion,
      estudianteNombre: r.matriculas?.estudiantes?.usuarios?.nombre ?? '',
      estudianteApellido: r.matriculas?.estudiantes?.usuarios?.apellido ?? '',
      estudianteCodigo: r.matriculas?.estudiantes?.codigo ?? '',
      asignaturaNombre: r.horarios?.asignaturas?.nombre ?? '',
      seccionNombre: r.horarios?.secciones?.nombre ?? '',
      gradoNombre: r.horarios?.secciones?.grados?.nombre ?? '',
      horaInicio: r.horarios?.hora_inicio ?? '',
      horaFin: r.horarios?.hora_fin ?? '',
    }));

    return { datos: registros, error: null };
  }

  async obtenerResumenHoy(fecha: string): Promise<RespuestaApi<ResumenAsistencia>> {
    const { data, error } = await this.supabase
      .from('asistencia').select('estado').eq('fecha', fecha);

    if (error) return { datos: null, error: error.message };

    const resumen: ResumenAsistencia = { presentes: 0, ausentes: 0, tardanzas: 0, justificados: 0 };
    (data ?? []).forEach((r: any) => {
      if (r.estado === 'presente') resumen.presentes++;
      else if (r.estado === 'ausente') resumen.ausentes++;
      else if (r.estado === 'tardanza') resumen.tardanzas++;
      else if (r.estado === 'justificado') resumen.justificados++;
    });

    return { datos: resumen, error: null };
  }

  private obtenerDiaSemana(fecha: string): string {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[new Date(fecha + 'T12:00:00').getDay()];
  }
}
