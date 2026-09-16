// Datos de respaldo para desarrollo local.
// Cuando el dashboard se conecte a la API real, este archivo dejará de usarse
// (ver src/api.js). Mantener el mismo shape: { id, studentName, folderName,
// queryStatus: 'success' | 'error', timestamp }.

export const mockExecutions = [
  { id: 1, studentName: 'Ana Sofía Ramírez', folderName: 'tarea_01_select', queryStatus: 'success', timestamp: '2023-10-25 10:00 AM' },
  { id: 2, studentName: 'Carlos Andrés Mora', folderName: 'tarea_01_select', queryStatus: 'success', timestamp: '2023-10-25 10:04 AM' },
  { id: 3, studentName: 'Daniela Paredes', folderName: 'tarea_01_select', queryStatus: 'error', timestamp: '2023-10-25 10:07 AM' },
  { id: 4, studentName: 'Felipe Burbano', folderName: 'tarea_02_where', queryStatus: 'success', timestamp: '2023-10-25 10:12 AM' },
  { id: 5, studentName: 'Gabriela Enríquez', folderName: 'tarea_02_where', queryStatus: 'success', timestamp: '2023-10-25 10:15 AM' },
  { id: 6, studentName: 'Hugo Narváez', folderName: 'tarea_02_where', queryStatus: 'success', timestamp: '2023-10-25 10:19 AM' },
  { id: 7, studentName: 'Isabela Rosero', folderName: 'tarea_03_joins', queryStatus: 'error', timestamp: '2023-10-25 10:23 AM' },
  { id: 8, studentName: 'Javier Timaná', folderName: 'tarea_03_joins', queryStatus: 'success', timestamp: '2023-10-25 10:28 AM' },
  { id: 9, studentName: 'Karen Villota', folderName: 'tarea_03_joins', queryStatus: 'success', timestamp: '2023-10-25 10:31 AM' },
  { id: 10, studentName: 'Luis Fernando Paz', folderName: 'tarea_04_groupby', queryStatus: 'success', timestamp: '2023-10-25 10:35 AM' },
  { id: 11, studentName: 'María José Ortega', folderName: 'tarea_04_groupby', queryStatus: 'success', timestamp: '2023-10-25 10:39 AM' },
  { id: 12, studentName: 'Nicolás Bastidas', folderName: 'tarea_04_groupby', queryStatus: 'error', timestamp: '2023-10-25 10:42 AM' },
  { id: 13, studentName: 'Paola Chamorro', folderName: 'tarea_05_subqueries', queryStatus: 'success', timestamp: '2023-10-25 10:47 AM' },
  { id: 14, studentName: 'Ricardo Guerrero', folderName: 'tarea_05_subqueries', queryStatus: 'success', timestamp: '2023-10-25 10:51 AM' },
  { id: 15, studentName: 'Sara Delgado', folderName: 'tarea_05_subqueries', queryStatus: 'success', timestamp: '2023-10-25 10:55 AM' },
  { id: 16, studentName: 'Tomás Cabrera', folderName: 'tarea_06_window', queryStatus: 'error', timestamp: '2023-10-25 11:02 AM' },
  { id: 17, studentName: 'Valentina López', folderName: 'tarea_06_window', queryStatus: 'success', timestamp: '2023-10-25 11:06 AM' },
  { id: 18, studentName: 'William Jojoa', folderName: 'tarea_06_window', queryStatus: 'success', timestamp: '2023-10-25 11:10 AM' },
  { id: 19, studentName: 'Ximena Arteaga', folderName: 'tarea_07_ddl', queryStatus: 'success', timestamp: '2023-10-25 11:14 AM' },
  { id: 20, studentName: 'Yerson Mallama', folderName: 'tarea_07_ddl', queryStatus: 'error', timestamp: '2023-10-25 11:18 AM' },
]
