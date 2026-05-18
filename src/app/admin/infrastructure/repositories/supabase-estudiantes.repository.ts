import { Injectable } from '@angular/core';
import { EstudiantesRepository } from '../../core/domain/ports/estudiantes.repository';
import { Estudiante, CrearEstudianteDto } from '../../core/domain/models/estudiante.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class SupabaseEstudiantesRepository implements EstudiantesRepository {
  private readonly supabase = obtenerClienteSupabase();

  async obtenerTodos(): Promise<RespuestaApi<Estudiante[]>> {
    const { data, error } = await this.supabase
      .from('estudiantes').select('*, usuarios(nombre, apellido, email)').order('codigo');
    if (error) return { datos: null, error: error.message };
    return { datos: (data ?? []).map(this.mapear), error: null };
  }

  async crear(dto: CrearEstudianteDto): Promise<RespuestaApi<Estudiante>> {
    const { data: rpcData, error: rpcError } = await this.supabase.rpc('registrar_usuario', {
      p_email: dto.email, p_password: dto.password,
      p_rol: 'estudiante', p_nombre: dto.nombre, p_apellido: dto.apellido,
    });
    if (rpcError) return { datos: null, error: rpcError.message };
    if ((rpcData as any)?.error) return { datos: null, error: (rpcData as any).error };

    const usuarioId = (rpcData as any).id;
    const { data, error } = await this.supabase
      .from('estudiantes').insert({
        usuario_id: usuarioId, codigo: dto.codigo,
        fecha_nacimiento: dto.fechaNacimiento ?? null, direccion: dto.direccion ?? null,
      })
      .select('*, usuarios(nombre, apellido, email)').single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async actualizar(id: string, dto: Partial<CrearEstudianteDto>): Promise<RespuestaApi<Estudiante>> {
    const { data, error } = await this.supabase
      .from('estudiantes').update({ codigo: dto.codigo, fecha_nacimiento: dto.fechaNacimiento, direccion: dto.direccion })
      .eq('id', id).select('*, usuarios(nombre, apellido, email)').single();
    if (error) return { datos: null, error: error.message };
    return { datos: this.mapear(data), error: null };
  }

  async eliminar(id: string): Promise<RespuestaApi<void>> {
    const { error } = await this.supabase.from('estudiantes').delete().eq('id', id);
    if (error) return { datos: null, error: error.message };
    return { datos: undefined, error: null };
  }

  private mapear(r: any): Estudiante {
    return {
      id: r.id, usuarioId: r.usuario_id, codigo: r.codigo,
      fechaNacimiento: r.fecha_nacimiento, direccion: r.direccion, fotoUrl: r.foto_url,
      nombre: r.usuarios?.nombre ?? '', apellido: r.usuarios?.apellido ?? '',
      email: r.usuarios?.email ?? '', creadoEn: r.creado_en,
    };
  }
}
