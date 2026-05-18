import { Injectable } from '@angular/core';
import { GradosRepository } from '../../core/domain/ports/grados.repository';
import {
  CrearGradoDto,
  CrearSeccionDto,
  Grado,
  GradoConSecciones,
  Seccion,
} from '../../core/domain/models/grado.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseGradosRepository implements GradosRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodos(): Promise<RespuestaApi<GradoConSecciones[]>> {
    const { data, error } = await this.supabase
      .from('grados')
      .select('*, secciones(*)')
      .order('orden');

    if (error) return { datos: null, error: error.message };

    const grados: GradoConSecciones[] = (data ?? []).map((g: any) => ({
      id: g.id,
      nombre: g.nombre,
      nivel: g.nivel,
      orden: g.orden,
      creadoEn: g.creado_en,
      secciones: (g.secciones ?? []).map((s: any) => ({
        id: s.id,
        gradoId: s.grado_id,
        nombre: s.nombre,
        anioAcademico: s.anio_academico,
        creadoEn: s.creado_en,
      })),
    }));

    return { datos: grados, error: null };
  }

  async crear(dto: CrearGradoDto): Promise<RespuestaApi<Grado>> {
    const { data, error } = await this.supabase
      .from('grados')
      .insert({ nombre: dto.nombre, nivel: dto.nivel, orden: dto.orden })
      .select()
      .single();

    if (error) return { datos: null, error: error.message };

    return {
      datos: { id: data.id, nombre: data.nombre, nivel: data.nivel, orden: data.orden, creadoEn: data.creado_en },
      error: null,
    };
  }

  async actualizar(id: string, dto: Partial<CrearGradoDto>): Promise<RespuestaApi<Grado>> {
    const { data, error } = await this.supabase
      .from('grados')
      .update({ nombre: dto.nombre, nivel: dto.nivel, orden: dto.orden })
      .eq('id', id)
      .select()
      .single();

    if (error) return { datos: null, error: error.message };

    return {
      datos: { id: data.id, nombre: data.nombre, nivel: data.nivel, orden: data.orden, creadoEn: data.creado_en },
      error: null,
    };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('grados').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  async crearSeccion(dto: CrearSeccionDto): Promise<RespuestaApi<Seccion>> {
    const { data, error } = await this.supabase
      .from('secciones')
      .insert({ grado_id: dto.gradoId, nombre: dto.nombre, anio_academico: dto.anioAcademico })
      .select()
      .single();

    if (error) return { datos: null, error: error.message };

    return {
      datos: { id: data.id, gradoId: data.grado_id, nombre: data.nombre, anioAcademico: data.anio_academico, creadoEn: data.creado_en },
      error: null,
    };
  }

  async actualizarSeccion(id: string, dto: Partial<CrearSeccionDto>): Promise<RespuestaApi<Seccion>> {
    const { data, error } = await this.supabase
      .from('secciones')
      .update({ nombre: dto.nombre, anio_academico: dto.anioAcademico })
      .eq('id', id)
      .select()
      .single();

    if (error) return { datos: null, error: error.message };

    return {
      datos: { id: data.id, gradoId: data.grado_id, nombre: data.nombre, anioAcademico: data.anio_academico, creadoEn: data.creado_en },
      error: null,
    };
  }

  async eliminarSeccion(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('secciones').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }
}
