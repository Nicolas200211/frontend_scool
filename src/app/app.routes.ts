import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { rolGuard } from './shared/guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/presentation/pages/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard(['admin'])],
    loadComponent: () =>
      import('./shared/presentation/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/presentation/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardAdminComponent
          ),
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./admin/presentation/pages/estudiantes/estudiantes.component').then(
            (m) => m.EstudiantesComponent
          ),
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./admin/presentation/pages/docentes/docentes.component').then(
            (m) => m.DocentesComponent
          ),
      },
      {
        path: 'asignaturas',
        loadComponent: () =>
          import('./admin/presentation/pages/asignaturas/asignaturas.component').then(
            (m) => m.AsignaturasComponent
          ),
      },
      {
        path: 'grados',
        loadComponent: () =>
          import('./admin/presentation/pages/grados/grados.component').then(
            (m) => m.GradosComponent
          ),
      },
      {
        path: 'matriculas',
        loadComponent: () =>
          import('./admin/presentation/pages/matriculas/matriculas.component').then(
            (m) => m.MatriculasComponent
          ),
      },
      {
        path: 'horarios',
        loadComponent: () =>
          import('./admin/presentation/pages/horarios/horarios.component').then(
            (m) => m.HorariosComponent
          ),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./admin/presentation/pages/asistencia/asistencia.component').then(
            (m) => m.AsistenciaAdminComponent
          ),
      },
      {
        path: 'apoderados',
        loadComponent: () =>
          import('./admin/presentation/pages/apoderados/apoderados.component').then(
            (m) => m.ApoderadosComponent
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./admin/presentation/pages/reportes/reportes.component').then(
            (m) => m.ReportesComponent
          ),
      },
    ],
  },
  {
    path: 'docente',
    canActivate: [authGuard, rolGuard(['docente'])],
    loadComponent: () =>
      import('./shared/presentation/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./docente/presentation/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardDocenteComponent
          ),
      },
      {
        path: 'mis-clases',
        loadComponent: () =>
          import('./docente/presentation/pages/mis-clases/mis-clases.component').then(
            (m) => m.MisClasesComponent
          ),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./docente/presentation/pages/asistencia/asistencia.component').then(
            (m) => m.AsistenciaDocenteComponent
          ),
      },
      {
        path: 'justificaciones',
        loadComponent: () =>
          import('./docente/presentation/pages/justificaciones/justificaciones.component').then(
            (m) => m.JustificacionesDocenteComponent
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./docente/presentation/pages/reportes/reportes.component').then(
            (m) => m.ReportesDocenteComponent
          ),
      },
    ],
  },
  {
    path: 'padre',
    canActivate: [authGuard, rolGuard(['padre'])],
    loadComponent: () =>
      import('./shared/presentation/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./padre/presentation/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardPadreComponent
          ),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./padre/presentation/pages/asistencia/asistencia.component').then(
            (m) => m.AsistenciaPadreComponent
          ),
      },
      {
        path: 'justificaciones',
        loadComponent: () =>
          import('./padre/presentation/pages/justificaciones/justificaciones.component').then(
            (m) => m.JustificacionesPadreComponent
          ),
      },
    ],
  },
  {
    path: 'estudiante',
    canActivate: [authGuard, rolGuard(['estudiante'])],
    loadComponent: () =>
      import('./shared/presentation/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./estudiante/presentation/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardEstudianteComponent
          ),
      },
      {
        path: 'asistencia',
        loadComponent: () =>
          import('./estudiante/presentation/pages/asistencia/asistencia.component').then(
            (m) => m.AsistenciaEstudianteComponent
          ),
      },
      {
        path: 'horario',
        loadComponent: () =>
          import('./estudiante/presentation/pages/horario/horario.component').then(
            (m) => m.HorarioEstudianteComponent
          ),
      },
    ],
  },
  {
    path: 'sin-acceso',
    loadComponent: () =>
      import('./shared/presentation/pages/sin-acceso/sin-acceso.component').then(
        (m) => m.SinAccesoComponent
      ),
  },
  { path: '**', redirectTo: 'auth/login' },
];
