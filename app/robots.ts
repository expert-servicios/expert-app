import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (process.env.PERSONAL_SITE_DEPLOYMENT === 'true') {
    return {
      rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/perfil-ksenia', '/perfil-ksenia-ru', '/mentoria-personal', '/mentoria-personal-ru', '/reserva-ksenia', '/reserva-ksenia-ru'] }],
      sitemap: 'https://kseniailicheva.com/sitemap.xml',
    };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/auth/', '/api/', '/gracias/']
      }
    ],
    sitemap: 'https://expertconsulting.es/sitemap.xml'
  };
}
