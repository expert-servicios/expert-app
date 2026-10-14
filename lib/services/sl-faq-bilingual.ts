import { getCatalogService } from '@/lib/utils/catalog';

export type ServiceFaqPair = {id:string;es:{q:string;a:string};ru:{q:string;a:string}};
const translations:Record<string,Array<{id:string;q:string;a:string}>>={
 'constitucion-sl':[
 {id:'capital',q:'Какой минимальный уставный капитал необходим?',a:'Капитал SL может составлять от 1 €. Пока сумма капитала и обязательного резерва не достигнет 3 000 €, применяются специальные правила формирования резерва и ответственности при ликвидации по статье 4 Ley de Sociedades de Capital.'},
 {id:'single-member',q:'Может ли SL иметь одного учредителя?',a:'Да. Sociedad Limitada Unipersonal (SLU) может принадлежать единственному участнику.'},
 {id:'autonomo',q:'Autónomo и empresario individual — разные юридические формы?',a:'Нет. Empresario individual — форма деятельности физического лица; autónomo — обычно обозначение самозанятого или системы RETA. SL — отдельное юридическое лицо.'},
 {id:'taxes',q:'Какие налоги платит SL?',a:'В зависимости от деятельности SL может уплачивать Impuesto sobre Sociedades, IVA и удерживать налоги. Ставки IS и льготы новых компаний зависят от условий, а выплаты учредителям могут иметь отдельные налоговые последствия.'},
 {id:'codes',q:'В чём разница между IAE, CNAE и objeto social?',a:'Objeto social описывает деятельность в уставе; IAE — налоговый классификатор фактических видов деятельности; CNAE-2025 — отдельная статистическая и административная классификация. Это разные понятия.'},
 {id:'reta',q:'Должны ли все учредители-администраторы платить RETA?',a:'Нет. Учитываются фактическая работа, полномочия, доля капитала и контроль над обществом по статье 305 LGSS.'},
 ],
 'constitucion-sl-circe':[
 {id:'modes',q:'Чем отличаются два варианта услуги CIRCE?',a:'При полном сопровождении EXPERT выполняет и координирует оформление SL. При индивидуальном обучении за 180 € + IVA клиент готовит процесс самостоятельно; EXPERT не подаёт DUE и не ведёт регистрацию вместо него. Полное сопровождение по каталогу — 499 € + IVA.'},
 {id:'foreign-partners',q:'Подходит ли CIRCE для иностранных учредителей?',a:'Возможность зависит от необходимых данных и налоговой идентификации участников. Если нет требуемого NIF/NIE, его нужно оформить заранее; сложные структуры требуют отдельной оценки.'},
 ]
};
const ids:Record<string,string[]>={'constitucion-sl':['capital','single-member','autonomo','taxes','codes','reta'],'constitucion-sl-circe':['modes','foreign-partners']};
export function getApprovedSlServiceFaqPairs(slug:string):ServiceFaqPair[]{
 const expected=ids[slug];if(!expected)return [];
 const es=getCatalogService(slug)?.faqs??[];
 const ru=translations[slug];
 if(es.length!==ru.length||es.length!==expected.length||new Set(ru.map(x=>x.id)).size!==ru.length||ru.some((x,i)=>x.id!==expected[i])){
   throw new Error('SL FAQ translation parity mismatch for '+slug);
 }
 return es.map((item,i)=>({id:expected[i],es:item,ru:{q:ru[i].q,a:ru[i].a}}));
}
export function getApprovedSlFaqs(slug:string,locale:'es'|'ru') {
 return getApprovedSlServiceFaqPairs(slug).map(pair=>pair[locale]);
}
