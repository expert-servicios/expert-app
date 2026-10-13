import type { KnowledgeDoc } from '@/lib/utils/docs';
import { IMMIGRATION_REVIEWED_GUIDES, toImmigrationGuideBody } from '@/lib/content/immigration-reviewed-2026';

/** Each correction here replaces, never duplicates, its legacy canonical doc. */
export const reviewedImmigrationEsDocs: KnowledgeDoc[] = IMMIGRATION_REVIEWED_GUIDES.map(guide=>({
 slug: guide.esSlug, category:'extranjeria-nacionalidad',
 title:guide.title.es, excerpt:guide.intro.es,
 tags:guide.id==='initial'?['residencia inicial','arraigo social','arraigo sociolaboral','extranjería','RD 1155/2024','RD 316/2026']:['renovación residencia','larga duración nacional','TIE','nóminas','extranjería'],
 updatedAt:'13 oct 2026',readTime:'8 min',
 relatedServiceSlugs:guide.id==='initial'?['permiso-residencia-inicial']:['renovacion-residencia'],
 relatedServiceCategories:['extranjeria-nacionalidad'],
 seoTitle:guide.title.es+' | EXPERT',seoDescription:guide.intro.es,
 body:toImmigrationGuideBody(guide.id,'es'),
}));
