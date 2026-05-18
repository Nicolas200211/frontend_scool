import { Injectable } from '@angular/core';
import { DocentesRepository } from '../../core/domain/ports/docentes.repository';
import { Docente, CrearDocenteDto } from '../../core/domain/models/docente.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseDocentesRepository implements DocentesRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodos(): Promise<RespuestaApi<Docente[]>> {
    const { data, error } = await this.supabase
      .from('docentes').select('*, usuarios(nombre, apellido, email, foto_url)').order('creado_en');
    if (error) return { datos: null, error: error.message };
    return { datos: (data ?? []).map(this.mapear), error: null };
  }

  async crear(dto: CrearDocenteDto): Promise<RespuestaApi<Docente>> {
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('registrar_usuario', {
      p_email: dto.email, p_password: dto.password,
      p_rol: 'docente', p_nombre: dto.nombre, p_apellido: dto.apellido,
    });
    if (rpcError) return { datos: null, error: rpcError.message };
    if ((rpcData as any)?.error) return { datos: null, error: (rpcData as any).error };

    const usuarioId = (rpcData as any).id;
    const { data, error } = await this.supabase
      .from('docentes').insert({ usuario_id: usuarioId, especialidad: dto.especialidad ?? null })
      .select('*, usuarios(nombre, apellido, email, foto_url)').single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async actualizar(id: string, especialidad: string): Promise<RespuestaApi<Docente>> {
    const { data, error } = await this.supabase
      .from('docentes').update({ especialidad })
      .eq('id', id).select('*, usuarios(nombre, apellido, email, foto_url)').single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('docentes').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  private mapear(r: any): Docente {
    return {
      id: r.id, usuarioId: r.usuario_id, especialidad: r.especialidad,
      nombre: r.usuarios?.nombre ?? '', apellido: r.usuarios?.apellido ?? '',
      email: r.usuarios?.email ?? '',
      fotoUrl: r.usuarios?.foto_url || r.usuarios?.fotoUrl || null,
      creadoEn: r.creado_en,
    };
  }
}
