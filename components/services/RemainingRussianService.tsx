import Link from 'next/link';
import { getCatalogService } from '@/lib/utils/catalog';
export const RU_REMAINING_SERVICES = {
  "baja-cese-actividad": {
    "path": "/ru/uslugi/baja-deyatelnosti",
    "title": "Закрытие деятельности",
    "intro": "Прекращение деятельности autónomo или компании, документы для Hacienda и RETA."
  },
  "cuentas-anuales": {
    "path": "/ru/uslugi/godovye-scheta",
    "title": "Годовая отчётность Cuentas Anuales",
    "intro": "Подготовка, утверждение и подача отчётности в Registro Mercantil."
  },
  "apoderamientos-mercantiles": {
    "path": "/ru/uslugi/korporativnye-doverennosti",
    "title": "Корпоративные доверенности и изменения",
    "intro": "Корпоративные решения, нотариальные полномочия и регистрация изменений."
  },
  "matriculacion": {
    "path": "/ru/uslugi/registratsiya-avtomobilya",
    "title": "Регистрация автомобиля",
    "intro": "Первичная регистрация и импорт, проверка документов, налогов и DGT."
  },
  "tramites-embarcaciones": {
    "path": "/ru/uslugi/registratsiya-sudna",
    "title": "Документы на прогулочные суда",
    "intro": "Регистрация, изменение владельца и документы Capitanía Marítima."
  },
  "compraventa-inmueble": {
    "path": "/ru/uslugi/pokupka-prodazha-nedvizhimosti",
    "title": "Купля-продажа недвижимости",
    "intro": "Проверка договора arras, налогов, нотариальных документов и регистрации."
  },
  "herencia": {
    "path": "/ru/uslugi/nasledstvo-v-ispanii",
    "title": "Наследство в Испании",
    "intro": "Документы наследников, имущество и налог Impuesto sobre Sucesiones."
  },
  "donacion": {
    "path": "/ru/uslugi/darstvennaya-imushchestva",
    "title": "Дарение имущества",
    "intro": "Налог на дарение, нотариальные документы и регистрация имущества."
  }
} as const;
export type RuRemainingServiceSlug = keyof typeof RU_REMAINING_SERVICES;
const RU_SERVICE_INCLUDES: Record<RuRemainingServiceSlug, readonly string[]> = {
  "baja-cese-actividad": [
    "Снятие с учёта в Hacienda (Modelo 036)",
    "Снятие с учёта в RETA",
    "Подача оставшихся налоговых деклараций",
    "Для компаний: решение о ликвидации, нотариальные документы и регистрация"
  ],
  "cuentas-anuales": [
    "Подготовка баланса и отчёта о прибылях и убытках",
    "Подготовка годовой пояснительной записки (memoria)",
    "Согласование утверждения на общем собрании",
    "Подача в Registro Mercantil",
    "Подтверждение подачи"
  ],
  "apoderamientos-mercantiles": [
    "Подготовка решения общего собрания или администратора",
    "Нотариальное оформление решения",
    "Регистрация в Registro Mercantil, когда требуется",
    "Уведомление Hacienda, если необходимо",
    "Подтверждение регистрации"
  ],
  "matriculacion": [
    "Проверка технических документов",
    "Расчёт и уплата IEDMT",
    "Оформление регистрации в DGT",
    "Получение номерных знаков и permiso de circulación"
  ],
  "tramites-embarcaciones": [
    "Регистрация судов",
    "Оформление смены владельца",
    "Оформление флага и необходимых разрешений",
    "Снятие с регистрационного учёта"
  ],
  "compraventa-inmueble": [
    "Проверка договора arras или предварительного договора",
    "Расчёт ITP или IVA+AJD в зависимости от сделки",
    "Сопровождение нотариального оформления",
    "Уплата налогов в автономном сообществе",
    "Регистрация в Registro de la Propiedad"
  ],
  "herencia": [
    "Получение сертификата последних волеизъявлений и сведений о страховании жизни",
    "Инвентаризация наследственного имущества",
    "Расчёт и уплата Impuesto de Sucesiones y Donaciones",
    "Нотариальный акт распределения наследства",
    "Регистрация прав собственности и сопутствующие действия"
  ],
  "donacion": [
    "Расчёт налога на дарение",
    "Нотариальный акт дарения",
    "Уплата налога",
    "Регистрация прав на недвижимость при необходимости"
  ]
};
export function RemainingRussianService({slug}:{slug:RuRemainingServiceSlug}) {
 const ru=RU_REMAINING_SERVICES[slug]; const service=getCatalogService(slug);
 if(!service) throw Error('Missing canonical service: '+slug);
 const esPath='/servicios/'+service.categoria+'/'+slug;
 const budget='/solicitar-presupuesto?servicio='+encodeURIComponent(slug)+'&origen='+encodeURIComponent('service:'+slug);
 return <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
  <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1]"><div className="mx-auto max-w-5xl">
   <Link href="/ru/uslugi" className="text-[#D4A017]">← Услуги</Link>
   <h1 className="mt-6 font-serif text-3xl font-bold md:text-5xl">{ru.title}</h1>
   <p className="mt-5 max-w-3xl text-lg leading-8">{ru.intro}</p>
   <p className="mt-6 text-xl font-semibold text-[#D4A017]">{service.price==='Consultar'?'Стоимость по запросу':service.price==='Precio variable'?'Индивидуальный расчёт':service.price}</p>
   <div className="mt-8 flex flex-wrap gap-4"><Link href={budget} className="bg-[#D4A017] px-6 py-3 font-bold text-[#0D1B2A]">Запросить предложение</Link><Link href={esPath} className="border border-[#D4A017] px-6 py-3">Español</Link></div>
  </div></section>
  <section className="mx-auto max-w-5xl px-6 py-16"><h2 className="font-serif text-2xl">Что входит в услугу</h2><ul className="mt-6 grid gap-4 sm:grid-cols-2">{RU_SERVICE_INCLUDES[slug].map(item=><li className="border border-[#D4A017]/25 bg-white p-5" key={item}>{item}</li>)}</ul>
  <p className="mt-8 border-l-4 border-[#D4A017] bg-white p-5 text-sm">Точный объём услуг и стоимость подтверждаются после проверки документов. Оригинальное описание и договорные условия доступны также на испанском языке.</p></section>
 </main>;
}
