# Registro de extranjería integrado en EXPERT Regulatory Registry

- Se reutilizan los crons activos: pulso diario, worker periódico y auditoría mensual. No se crea una nueva vigilancia ni se automatiza la publicación.
- RD 1155/2024 ya existe con baseline; se conserva su fuente canónica sin duplicarla.
- Se registran RD 316/2026 y sentencias publicadas en septiembre como fuentes BOE y se enlazan a las dos guías ES/RU. La fecha de detección se distingue de publicación, vigencia y revisión jurídica.
- Migraciones devuelve HTTP 403 en servidor; sus fichas existentes permanecen desactivadas como referencia manual. Próxima revisión documental: 13/11/2026.
- Los cambios crean evidencias y requieren clasificación y autorización editorial/jurídica antes de modificar contenido, KIA o producto.
- Tras desplegar migración, comprobar fuentes y dependencias en Supabase, baselines y errores; no confundir CI verde con migración ejecutada.
