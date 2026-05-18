import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';

import { usuarios, sesiones } from './schema/auth.schema';
import { estudiantes, docentes, apoderados } from './schema/personas.schema';
import {
  grados,
  secciones,
  asignaturas,
  horarios,
  anuncios,
  comunicados,
} from './schema/academico.schema';
import {
  matriculas,
  asistencia,
  justificaciones,
} from './schema/matriculas.schema';

const runSeed = async () => {
  if (!process.env['DATABASE_URL']) {
    throw new Error('La variable de entorno DATABASE_URL es obligatoria');
  }

  // Configurar conexión a la base de datos
  const client = postgres(process.env['DATABASE_URL']);
  const db = drizzle(client);

  console.log('🌱 Iniciando la población de datos (Seed)...');

  try {
    // --- 1. LIMPIEZA DE TABLAS (En orden inverso de dependencias) ---
    console.log('🧹 Limpiando datos existentes...');
    await db.delete(justificaciones);
    await db.delete(asistencia);
    await db.delete(matriculas);
    await db.delete(horarios);
    await db.delete(anuncios);
    await db.delete(comunicados);
    await db.delete(secciones);
    await db.delete(asignaturas);
    await db.delete(grados);
    await db.delete(apoderados);
    await db.delete(docentes);
    await db.delete(estudiantes);
    await db.delete(sesiones);
    await db.delete(usuarios);
    console.log('✅ Tablas limpias.');

    // --- 2. POBLACIÓN DE DATOS (En orden de dependencias) ---
    
    console.log('📝 Insertando Usuarios Administradores...');
    const hash = sql`crypt('123456', gen_salt('bf', 10))`;
    
    // Admin
    const adminData = { email: 'admin@colegio.edu', passwordHash: hash, rol: 'admin' as const, nombre: 'Administrador', apellido: 'Principal' };
    await db.insert(usuarios).values([adminData]);

    console.log('📝 Insertando Usuarios Docentes...');
    // Docentes (12 docentes)
    const especialidades = [
      'Matemáticas', 'Comunicación', 'Ciencias y Biología', 'Historia y Geografía', 'Educación Física', 
      'Arte y Cultura', 'Inglés', 'Computación', 'Educación Cívica', 'Religión', 'Física', 'Química'
    ];
    const docentesUsersData = especialidades.map((esp, i) => ({
      email: `docente${i + 1}@colegio.edu`,
      passwordHash: hash,
      rol: 'docente' as const,
      nombre: `Profesor${i + 1}`,
      apellido: `ApellidoDoc${i + 1}`,
    }));
    const insertedDocentesUsers = await db.insert(usuarios).values(docentesUsersData).returning();

    const docentesPerData = insertedDocentesUsers.map((user, i) => ({
      usuarioId: user.id,
      especialidad: especialidades[i],
    }));
    const createdDocentes = await db.insert(docentes).values(docentesPerData).returning();

    console.log('📝 Insertando Usuarios Estudiantes (66 alumnos)...');
    // Estudiantes (66 estudiantes para llenar 22 secciones con 3 c/u)
    const estudiantesUsersData = Array.from({ length: 66 }).map((_, i) => ({
      email: `estudiante${i + 1}@colegio.edu`,
      passwordHash: hash,
      rol: 'estudiante' as const,
      nombre: `Alumno${i + 1}`,
      apellido: `ApellidoEst${i + 1}`,
    }));
    const insertedEstudiantesUsers = await db.insert(usuarios).values(estudiantesUsersData).returning();

    const estudiantesPerData = insertedEstudiantesUsers.map((user, i) => ({
      usuarioId: user.id,
      codigo: `EST-2026-${(i + 1).toString().padStart(3, '0')}`,
      fechaNacimiento: `201${Math.floor((i % 8) + 0)}-0${(i % 9) + 1}-15`, // Variar fechas
      direccion: `Av. Principal ${100 + i}, Distrito`,
    }));
    const createdEstudiantes = await db.insert(estudiantes).values(estudiantesPerData).returning();

    console.log('📝 Insertando Apoderados...');
    // Apoderados (33 apoderados, cada uno a cargo de 2 estudiantes para simular hermanos)
    const apoderadosUsersData = Array.from({ length: 33 }).map((_, i) => ({
      email: `apoderado${i + 1}@correo.com`,
      passwordHash: hash,
      rol: 'padre' as const,
      nombre: `Apoderado${i + 1}`,
      apellido: `ApellidoApo${i + 1}`,
    }));
    const insertedApoderadosUsers = await db.insert(usuarios).values(apoderadosUsersData).returning();

    const apoderadosPerData = [];
    for (let i = 0; i < 33; i++) {
      apoderadosPerData.push({ usuarioId: insertedApoderadosUsers[i].id, estudianteId: createdEstudiantes[i * 2].id, parentesco: 'Padre' });
      apoderadosPerData.push({ usuarioId: insertedApoderadosUsers[i].id, estudianteId: createdEstudiantes[i * 2 + 1].id, parentesco: 'Padre' });
    }
    const createdApoderados = await db.insert(apoderados).values(apoderadosPerData).returning();

    console.log('📝 Insertando Estructura Académica (Grados y Secciones)...');
    
    // Grados
    const nombresGradosPri = ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];
    const nombresGradosSec = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];
    
    const gradosData = [
      ...nombresGradosPri.map((n, i) => ({ nombre: n, nivel: 'primaria' as const, orden: i + 1 })),
      ...nombresGradosSec.map((n, i) => ({ nombre: n, nivel: 'secundaria' as const, orden: i + 7 })),
    ];
    const createdGrados = await db.insert(grados).values(gradosData).returning();

    // Secciones (A y B por cada grado = 22 secciones totales)
    const seccionesData = [];
    for (const grado of createdGrados) {
      seccionesData.push({ gradoId: grado.id, nombre: 'A', anioAcademico: 2026 });
      seccionesData.push({ gradoId: grado.id, nombre: 'B', anioAcademico: 2026 });
    }
    const createdSecciones = await db.insert(secciones).values(seccionesData).returning();

    console.log('📝 Insertando Asignaturas (10 cursos)...');
    // Asignaturas
    const nombresAsignaturas = [
      { nombre: 'Matemáticas', cod: 'MAT' }, { nombre: 'Comunicación', cod: 'COM' },
      { nombre: 'Ciencias y Tecnología', cod: 'CYT' }, { nombre: 'Personal Social / Historia', cod: 'HIS' },
      { nombre: 'Educación Física', cod: 'EFI' }, { nombre: 'Arte y Cultura', cod: 'ART' },
      { nombre: 'Inglés', cod: 'ING' }, { nombre: 'Computación', cod: 'CMP' },
      { nombre: 'Educación Cívica', cod: 'CIV' }, { nombre: 'Religión', cod: 'REL' }
    ];
    const asignaturasData = nombresAsignaturas.map((a, i) => ({
      nombre: a.nombre,
      codigo: `${a.cod}-00${i + 1}`,
      descripcion: `Curso integral de ${a.nombre}`
    }));
    const createdAsignaturas = await db.insert(asignaturas).values(asignaturasData).returning();

    console.log('📝 Asignando Horarios a Profesores y Secciones...');
    // Horarios (asignar horarios básicos para que todas las secciones tengan al menos dos cursos)
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
    const horariosData = [];
    for (let i = 0; i < createdSecciones.length; i++) {
      // Matemáticas
      horariosData.push({
        seccionId: createdSecciones[i].id,
        asignaturaId: createdAsignaturas[0].id, 
        docenteId: createdDocentes[0].id, // Docente de mates
        diaSemana: dias[0],
        horaInicio: '08:00', horaFin: '09:30'
      });
      // Comunicación
      horariosData.push({
        seccionId: createdSecciones[i].id,
        asignaturaId: createdAsignaturas[1].id, 
        docenteId: createdDocentes[1].id, // Docente de comunicación
        diaSemana: dias[1],
        horaInicio: '10:00', horaFin: '11:30'
      });
      // Ciencias
      horariosData.push({
        seccionId: createdSecciones[i].id,
        asignaturaId: createdAsignaturas[2].id, 
        docenteId: createdDocentes[2].id, // Docente de ciencias
        diaSemana: dias[2],
        horaInicio: '08:00', horaFin: '09:30'
      });
    }
    const createdHorarios = await db.insert(horarios).values(horariosData).returning();

    console.log('📝 Matriculando estudiantes y simulando control escolar...');
    
    // Matricular a los 66 estudiantes (3 alumnos exactos por cada una de las 22 secciones)
    const matriculasData = createdEstudiantes.map((est, i) => ({
      estudianteId: est.id,
      seccionId: createdSecciones[Math.floor(i / 3)].id,
      anioAcademico: 2026,
      estado: 'activo' as const,
    }));
    const createdMatriculas = await db.insert(matriculas).values(matriculasData).returning();

    // Asistencias (simulando casos de uso)
    const asistenciasData = [
      { matriculaId: createdMatriculas[0].id, horarioId: createdHorarios[0].id, fecha: '2026-03-04', estado: 'ausente' as const, observacion: 'Descanso médico' },
      { matriculaId: createdMatriculas[1].id, horarioId: createdHorarios[0].id, fecha: '2026-03-04', estado: 'presente' as const, observacion: '' },
      { matriculaId: createdMatriculas[2].id, horarioId: createdHorarios[0].id, fecha: '2026-03-04', estado: 'tardanza' as const, observacion: 'Tráfico pesado' },
      { matriculaId: createdMatriculas[10].id, horarioId: createdHorarios[10].id, fecha: '2026-03-04', estado: 'ausente' as const, observacion: 'Motivo familiar' },
    ];
    const createdAsistencias = await db.insert(asistencia).values(asistenciasData).returning();

    // Justificaciones
    const justificacionesData = [
      { asistenciaId: createdAsistencias[0].id, apoderadoId: createdApoderados[0].id, motivo: 'Certificado de la clínica', estado: 'aprobado' as const },
      { asistenciaId: createdAsistencias[3].id, apoderadoId: createdApoderados[5].id, motivo: 'Viaje de emergencia', estado: 'pendiente' as const },
    ];
    await db.insert(justificaciones).values(justificacionesData);

    console.log('📝 Insertando Anuncios iniciales de prueba...');
    const anunciosSeedData = [];
    for (let i = 0; i < createdSecciones.length; i++) {
      // Examen para cada sección
      anunciosSeedData.push({
        docenteId: createdDocentes[0].id,
        seccionId: createdSecciones[i].id,
        tipo: 'examen',
        titulo: 'EXAMEN',
        mensaje: 'Examen parcial de Matemáticas / Álgebra programado para este Lunes a las 08:00.',
      });
      // Calificación/Entregado para cada sección
      anunciosSeedData.push({
        docenteId: createdDocentes[2].id,
        seccionId: createdSecciones[i].id,
        tipo: 'entregado',
        titulo: 'ENTREGADO',
        mensaje: 'Tu proyecto final de Ciencias y Tecnología ha sido calificado con un récord sobresaliente.',
      });
    }
    await db.insert(anuncios).values(anunciosSeedData);

    console.log('📢 Insertando Comunicados Globales (Admin)...');
    await db.insert(comunicados).values([
      {
        audiencia: 'docentes',
        importancia: 'alta',
        titulo: 'CIERRE DE ACTAS',
        mensaje: 'Estimados docentes, recuerden que el cierre mensual de actas e informes académicos del mes de Mayo está programado para el día 30 de Mayo. Por favor, suban sus calificaciones.',
      },
      {
        audiencia: 'todos',
        importancia: 'informativo',
        titulo: 'FUMIGACIÓN DEL PLANTEL',
        mensaje: 'Se les informa a toda la comunidad educativa que el próximo viernes se realizará una fumigación general. No habrá acceso a las instalaciones después de las 2:00 PM.',
      }
    ]);

    console.log('🎉 ¡Seed ejecutado correctamente! Entorno escolar completo generado.');
  } catch (error) {
    console.error('❌ Error durante la ejecución del seed:', error);
  } finally {
    // Cerrar conexión
    await client.end();
  }
};

runSeed();
