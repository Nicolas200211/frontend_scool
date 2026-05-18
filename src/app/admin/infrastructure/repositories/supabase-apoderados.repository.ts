import { Injectable } from '@angular/core';
import { ApoderadosRepository } from '../../core/domain/ports/apoderados.repository';
import { Apoderado, ApoderadoAgrupado, CrearApoderadoDto, VincularHijoDto } from '../../core/domain/models/apoderado.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseApoderadosRepository implements ApoderadosRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodos(): Promise<RespuestaApi<ApoderadoAgrupado[]>> {
    const { data, error } = await this.supabase
      .from('apoderados')
      .select('id, usuario_id, estudiante_id, parentesco, usuarios(nombre, apellido, email), estudiantes(codigo, usuarios(nombre, apellido))')
      .order('usuario_id');

    if (error) return { datos: null, error: error.message };

    const mapa = new Map<string, ApoderadoAgrupado>();
    for (const r of data ?? []) {
      const uid = r.usuario_id as string;
      if (!mapa.has(uid)) {
        mapa.set(uid, {
          usuarioId: uid,
          nombre: (r as any).usuarios?.nombre ?? '',
          apellido: (r as any).usuarios?.apellido ?? '',
          email: (r as any).usuarios?.email ?? '',
          hijos: [],
        });
      }
      mapa.get(uid)!.hijos.push({
        apoderadoId: r.id as string,
        estudianteId: r.estudiante_id as string,
        estudianteNombre: (r as any).estudiantes?.usuarios?.nombre ?? '',
        estudianteApellido: (r as any).estudiantes?.usuarios?.apellido ?? '',
        estudianteCodigo: (r as any).estudiantes?.codigo ?? '',
        parentesco: r.parentesco as string,
      });
    }

    return { datos: Array.from(mapa.values()), error: null };
  }

  async crear(dto: CrearApoderadoDto): Promise<RespuestaApi<Apoderado>> {
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('registrar_usuario', {
      p_email: dto.email, p_password: dto.password,
      p_rol: 'padre', p_nombre: dto.nombre, p_apellido: dto.apellido,
    });
    if (rpcError) return { datos: null, error: rpcError.message };
    if (rpcData?.error) return { datos: null, error: rpcData.error };

    const usuarioId = rpcData?.id;
    if (!usuarioId) return { datos: null, error: 'No se pudo obtener el ID del usuario' };

    const { data, error } = await this.supabase
      .from('apoderados')
      .insert({ usuario_id: usuarioId, estudiante_id: dto.estudianteId, parentesco: dto.parentesco })
      .select('id, usuario_id, estudiante_id, parentesco')
      .single();

    if (error) return { datos: null, error: error.message };

    return {
      datos: {
        id: data.id, usuarioId: data.usuario_id, estudianteId: data.estudiante_id,
        parentesco: data.parentesco, nombre: dto.nombre, apellido: dto.apellido, email: dto.email,
        estudianteNombre: '', estudianteApellido: '', estudianteCodigo: '',
      },
      error: null,
    };
  }

  async vincularHijo(dto: VincularHijoDto): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('apoderados').insert({
      usuario_id: dto.usuarioId, estudiante_id: dto.estudianteId, parentesco: dto.parentesco,
    });
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  async desvincularHijo(apoderadoId: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('apoderados').delete().eq('id', apoderadoId);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  async eliminar(usuarioId: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('usuarios').delete().eq('id', usuarioId);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }
}
