-- Estudiante: Jose Alejandro Bernal Figueroa
-- Taller: 06 - Verificacion de contactos

SELECT
  COUNT(*) AS total_contactos,
  COUNTIF(email IS NOT NULL) AS contactos_con_email
FROM `infrabigdataces.BRONCE.GOOGLE_SHEETS_BASE_CONTACTOS`;
