import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AuthRepository } from './auth/core/domain/ports/auth.repository';
import { SupabaseAuthRepository } from './auth/infrastructure/repositories/supabase-auth.repository';
import { GradosRepository } from './admin/core/domain/ports/grados.repository';
import { SupabaseGradosRepository } from './admin/infrastructure/repositories/supabase-grados.repository';
import { AsignaturasRepository } from './admin/core/domain/ports/asignaturas.repository';
import { SupabaseAsignaturasRepository } from './admin/infrastructure/repositories/supabase-asignaturas.repository';
import { DocentesRepository } from './admin/core/domain/ports/docentes.repository';
import { SupabaseDocentesRepository } from './admin/infrastructure/repositories/supabase-docentes.repository';
import { EstudiantesRepository } from './admin/core/domain/ports/estudiantes.repository';
import { SupabaseEstudiantesRepository } from './admin/infrastructure/repositories/supabase-estudiantes.repository';
import { HorariosRepository } from './admin/core/domain/ports/horarios.repository';
import { SupabaseHorariosRepository } from './admin/infrastructure/repositories/supabase-horarios.repository';
import { MatriculasRepository } from './admin/core/domain/ports/matriculas.repository';
import { SupabaseMatriculasRepository } from './admin/infrastructure/repositories/supabase-matriculas.repository';
import { AsistenciaRepository } from './admin/core/domain/ports/asistencia.repository';
import { SupabaseAsistenciaRepository } from './admin/infrastructure/repositories/supabase-asistencia.repository';
import { JustificacionesRepository } from './admin/core/domain/ports/justificaciones.repository';
import { SupabaseJustificacionesRepository } from './admin/infrastructure/repositories/supabase-justificaciones.repository';
import { PadreRepository } from './padre/core/domain/ports/padre.repository';
import { SupabasePadreRepository } from './padre/infrastructure/repositories/supabase-padre.repository';
import { EstudianteRepository } from './estudiante/core/domain/ports/estudiante.repository';
import { SupabaseEstudianteRepository } from './estudiante/infrastructure/repositories/supabase-estudiante.repository';
import { ApoderadosRepository } from './admin/core/domain/ports/apoderados.repository';
import { SupabaseApoderadosRepository } from './admin/infrastructure/repositories/supabase-apoderados.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: AuthRepository, useClass: SupabaseAuthRepository },
    { provide: GradosRepository, useClass: SupabaseGradosRepository },
    { provide: AsignaturasRepository, useClass: SupabaseAsignaturasRepository },
    { provide: DocentesRepository, useClass: SupabaseDocentesRepository },
    { provide: EstudiantesRepository, useClass: SupabaseEstudiantesRepository },
    { provide: HorariosRepository, useClass: SupabaseHorariosRepository },
    { provide: MatriculasRepository, useClass: SupabaseMatriculasRepository },
    { provide: AsistenciaRepository, useClass: SupabaseAsistenciaRepository },
    { provide: JustificacionesRepository, useClass: SupabaseJustificacionesRepository },
    { provide: PadreRepository, useClass: SupabasePadreRepository },
    { provide: EstudianteRepository, useClass: SupabaseEstudianteRepository },
    { provide: ApoderadosRepository, useClass: SupabaseApoderadosRepository },
  ],
};
