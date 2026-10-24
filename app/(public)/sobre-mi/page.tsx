import { redirect } from 'next/navigation';

/** La biografía personal de la fundadora tiene su sitio canónico propio. */
export default function SobreMiRedirect() {
  redirect('https://kseniailicheva.com/#sobre-mi');
}
