# EXPERT / Holded + ChatGPT — Creatividades ES/RU (24/10/2026)

Este directorio es un inventario de trabajo de las imagenes de la campana evergreen: **no es publicacion ni autorizacion para publicidad**.

## Colecciones disponibles
- Imagen OG para compartir enlace 1200x630, publicaciones horizontales y cuadradas, YouTube, cabecera LinkedIn, stories/reels, post 4:5.
- Carrusel en ruso: 5 imagenes 1080x1080 (version revisada; mocks ilustrativos).
- Conceptos de anuncios blanco/azul marino, 1:1.
- Coleccion adicional de servicios: prueba 14 dias, demostracion, migracion con/sin inventario, implantacion, formacion/soporte, integracion y asesoramiento, en ES/RU cuando exista.
- Originales generados con IA y referencias de marca.

**Material binario:** los PNG/JPG originales se conservan en el pack ZIP `EXPERT_Holded_ChatGPT_Archivo_Completo_20261024.zip`, archivado en la biblioteca privada `/EXPERT/Marketing/ChatGPT-Ads-Holded/`. **NO se han transferido imagenes binarias a GitHub** desde el conector de esta sesion. No apuntar desde codigo a rutas de imagen del repo hasta confirmar su inclusion y verificar su hash.

## Script reproducible
`python scripts/generate_holded_assets.py --source path/a/original.png --output carpeta/salida`

Requiere Pillow. Emplea escalado *contain*, no *cover*: nunca se cortan textos ni logos, pero pueden quedar bandas a los lados. El script adapta proporciones; no recrea imagenes mediante un modelo generativo. El ZIP incluye tambien los scripts historicos `build_social_pack.py` y `create_ru_carousel.py`.

## Calidad, marcas y cumplimiento pendientes
1. Sustituir avatar generado de KIA por el avatar original autorizado del repositorio.
2. Reutilizar logos EXPERT de `public/branding/expert-approved/` para superficies claras/oscuras y logos oficiales Holded/ChatGPT segun permisos; no fiarse de interpretaciones dibujadas por IA.
3. Revisar ortografia del texto en ES/RU y margenes de seguridad en cada dimension. Evitar recortes de cabeceras.
4. Verificar claims de seguridad, IA, conexion, acciones permitidas por el MCP y la prueba de 14 dias. No prometer presentacion automatica de impuestos.
5. No incluir descuentos estacionales no aprobados. Algunos originales antiguos contienen afirmaciones no validadas: material de trabajo, no creatividades listas para anuncios.
6. Cuando los PNG finales hayan pasado control de calidad, incorporarlos al repo o al CDN y ajustar OG de la landing exclusivamente con ruta de archivo real.

Relacionadas: [PR #838](https://github.com/expert-servicios/expert-app/pull/838) landing y [PR #837](https://github.com/expert-servicios/expert-app/pull/837) plan de campana.
