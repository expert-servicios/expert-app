import type { Metadata } from 'next';
import { PrivacyAndCompanyServices } from '@/components/services/PrivacyAndCompanyServices';
export const metadata: Metadata={title:'Política de privacidad y adecuación RGPD | EXPERT',description:'Servicios de privacidad, implantación RGPD y documentos legales de plataformas. Diagnóstico gratuito y presupuesto profesional.',alternates:{canonical:'https://expertconsulting.es/servicios/proteccion-datos',languages:{'es-ES':'https://expertconsulting.es/servicios/proteccion-datos','ru-RU':'https://expertconsulting.es/ru/uslugi/rgpd-dokumenty-platformy','x-default':'https://expertconsulting.es/servicios/proteccion-datos'}}};
export default function Page(){return <PrivacyAndCompanyServices locale="es"/>;}
