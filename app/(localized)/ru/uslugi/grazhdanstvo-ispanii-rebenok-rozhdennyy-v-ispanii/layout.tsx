import type { ReactNode } from 'react';
import { RuNationalityRelatedResources } from '@/components/i18n/RuNationalityRelatedResources';

export default function RuNationalityServiceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RuNationalityRelatedResources />
    </>
  );
}
