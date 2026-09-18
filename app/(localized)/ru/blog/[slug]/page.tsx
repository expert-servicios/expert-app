import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RuNationalityResourcePage } from '@/components/i18n/RuNationalityResourcePage';
import { RU_NATIONALITY_RESOURCES, getRuNationalityResource } from '@/lib/i18n/ru-nationality-resources';

const BASE_URL = 'https://expertconsulting.es';

export function generateStaticParams() {
  return RU_NATIONALITY_RESOURCES.filter((item) => item.kind === 'blog').map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = getRuNationalityResource('blog', slug);
  if (!resource) return {};
  const ruPath = `/ru/blog/${resource.slug}`;
  return {
    title: `${resource.title} | EXPERT`,
    description: resource.description,
    alternates: {
      canonical: `${BASE_URL}${ruPath}`,
      languages: { 'es-ES': `${BASE_URL}${resource.esPath}`, 'ru-RU': `${BASE_URL}${ruPath}`, 'x-default': `${BASE_URL}${resource.esPath}` },
    },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: { type: 'article', locale: 'ru_RU', title: `${resource.title} | EXPERT`, description: resource.description, url: `${BASE_URL}${ruPath}` },
  };
}

export default async function RuBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = getRuNationalityResource('blog', slug);
  if (!resource) notFound();
  return <RuNationalityResourcePage resource={resource} />;
}
