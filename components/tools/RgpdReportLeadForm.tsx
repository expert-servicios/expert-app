'use client';
import { useState } from 'react';
import Link from 'next/link';
import { getRecaptchaToken } from '@/lib/utils/recaptcha-client';
type Answer=boolean|'none'|'basic'|'advanced'|'ordinary'|'startup'|'multiple'|'unknown';
export function RgpdReportLeadForm({answers,locale='es'}:{answers:Record<string,Answer>;locale?:'es'|'ru'}){
 const ru=locale==='ru';
 const [requestId,setRequestId]=useState<string | null>(null);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[method,setMethod]=useState<'download'|'email'>('download');
 const [informed,setInformed]=useState(false),[marketing,setMarketing]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const download=async()=>{if(!name.trim()||!email.includes('@')||!informed||pending)return;setPending(true);setMessage('');
  try{
    const token=await getRecaptchaToken('rgpd_report');
    if(!token){setMessage(ru?'Не удалось проверить защиту формы.':'No se pudo completar la verificación antiabuso.');return;}
    const stableRequestId=requestId ?? crypto.randomUUID();
    if(!requestId)setRequestId(stableRequestId);
    const r=await fetch('/api/rgpd/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:stableRequestId,name,email,method,locale,marketingConsent:marketing,informed,answers,recaptchaToken:token})});
    if(!r.ok){const data=await r.json().catch(()=>({}));setMessage(data.error==='russian_pdf_pending_font_qa'?'PDF на русском языке пока проходит техническую проверку. Бесплатные рекомендации доступны выше.':(ru?'Не удалось создать отчёт. Попробуйте позже.':'No se pudo generar el informe. Puedes consultar gratis el resultado anterior.'));return;}
    if(method==='email' && r.headers.get('Content-Type')?.includes('application/pdf')) {
      const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='guia-rgpd-expert.pdf';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setRequestId(null);
      setMessage(ru?'Не удалось отправить письмо. Памятка загружена напрямую.':'No se pudo entregar el correo. El PDF se ha descargado directamente.');
      return;
    }
    if(method==='email'){setRequestId(null);setMessage(ru?'Письмо отправлено на указанную почту.':'Hemos enviado el informe al correo indicado.');return;}
    const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='guia-rgpd-expert.pdf';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setRequestId(null);setMessage(ru?'Файл сформирован.':'Informe generado para descarga.');
  }catch{setMessage(ru?'Ошибка подключения.':'No hay conexión. Vuelve a intentarlo.');}finally{setPending(false);}
 };
 return <section className="mt-7 border border-[#D4A017]/30 bg-[#F8F6F1] p-5"><h3 className="font-serif text-xl font-bold">{ru?'Персональная памятка RGPD в PDF':'Tu guía RGPD personalizada en PDF'}</h3><p className="mt-2 text-sm leading-6">{ru?'Основные результаты уже доступны бесплатно. Чтобы заказать расширенный отчёт, укажите имя и электронную почту.':'Tu resultado y las guías anteriores son gratuitos y no requieren registro. Si quieres recibir un informe personalizado, deja solo tu nombre y correo.'}</p>
 <div className="mt-4 space-y-3"><label className="block text-sm font-bold">{ru?'Имя':'Nombre'}<input required value={name} onChange={e=>{setName(e.target.value);setRequestId(null)}} minLength={2} maxLength={80} autoComplete="given-name" className="mt-1 w-full rounded border border-[#D4A017]/30 bg-white p-3" /></label>
 <label className="block text-sm font-bold">{ru?'Электронная почта':'Correo electrónico'}<input required type="email" value={email} onChange={e=>{setEmail(e.target.value);setRequestId(null)}} maxLength={160} autoComplete="email" className="mt-1 w-full rounded border border-[#D4A017]/30 bg-white p-3" /></label>
 <fieldset className="space-y-2"><legend className="text-sm font-bold">{ru?'Как получить отчёт':'Cómo quieres recibirlo'}</legend>
 <label className="flex items-center gap-2 text-sm"><input type="radio" checked={method==='download'} onChange={()=>{setMethod('download');setRequestId(null)}}/>{ru?'Скачать PDF':'Descargar PDF'}</label>
 <label className="flex items-center gap-2 text-sm"><input type="radio" checked={method==='email'} onChange={()=>{setMethod('email');setRequestId(null)}}/>{ru?'Получить по электронной почте':'Recibir por email'}</label></fieldset>
 <div className="rounded border border-[#D4A017]/30 bg-white p-3 text-xs leading-5" role="note">
   <strong>{ru?'Информация об обработке данных':'Información básica sobre protección de datos'}</strong>
   <p>{ru?'Ответственный: EXPERT ESTUDIOS PROFESIONALES, S.L.U. (info@expertconsulting.es). Цель: подготовка и доставка запрошенной памятки, запись факта обращения и предотвращение повторных запросов. Основание: выполнение запроса пользователя (преддоговорные действия, ст. 6.1.b RGPD). Обработка рекламных сообщений — только по отдельному согласию. Получатели: поставщики хостинга, базы данных и почты в рамках договоров обработки. Предлагаемый срок хранения обращений без дальнейших отношений: 12 месяцев; при наличии иных услуг, согласия на рассылку или юридических обязанностей применяются отдельные сроки. Вы вправе запросить доступ, исправление, удаление, ограничение обработки, возражение или переносимость, а также подать жалобу в AEPD.':'Responsable: EXPERT ESTUDIOS PROFESIONALES, S.L.U. (info@expertconsulting.es). Finalidad: preparar y entregar la guía solicitada, registrar la petición y evitar duplicados. Base propuesta: atención de la solicitud a petición de la persona interesada (medidas precontractuales, art. 6.1.b RGPD); comunicaciones comerciales únicamente con consentimiento separado. Destinatarios: proveedores de alojamiento, base de datos y correo como encargados. Conservación propuesta: 12 meses para la solicitud informativa sin relación posterior; los expedientes de otros servicios, las pruebas de consentimiento y las obligaciones legales tienen sus propias reglas. Derechos: acceso, rectificación, supresión, limitación, oposición y portabilidad; reclamación ante la AEPD.'}</p>
   <p className="mt-1">{ru?'Полная политика':'Información ampliada'}: <Link href="/privacidad" className="underline">expertconsulting.es/privacidad</Link>.</p>
 </div>
 <label className="flex items-start gap-2 text-xs leading-5"><input className="mt-1" type="checkbox" checked={informed} onChange={e=>{setInformed(e.target.checked);setRequestId(null)}}/><span>{ru?'Я ознакомился(лась) с информацией об обработке моего имени и email для подготовки и доставки отчёта и регистрации запроса в EXPERT.':'He leído la información sobre el uso de mi nombre y correo para generar y entregar el informe y registrar mi solicitud en EXPERT.'} <Link href="/privacidad" className="underline">{ru?'Политика конфиденциальности':'Política de privacidad'}</Link></span></label>
 <label className="flex items-start gap-2 text-xs leading-5"><input className="mt-1" type="checkbox" checked={marketing} onChange={e=>{setMarketing(e.target.checked);setRequestId(null)}}/><span>{ru?'Хочу получать новости и предложения EXPERT (необязательно).':'Quiero recibir novedades y propuestas de EXPERT (opcional y no preseleccionado).'}</span></label>
 <button type="button" disabled={pending||!name.trim()||!email.includes('@')||!informed} onClick={()=>void download()} className="min-h-12 w-full rounded bg-[#D4A017] px-4 font-bold disabled:opacity-50">{pending?(ru?'Подготовка…':'Generando…'):(method==='email'?(ru?'Отправить на почту':'Enviarme el informe'):(ru?'Скачать PDF':'Generar y descargar PDF'))}</button>
 {message&&<p role="status" className="text-sm">{message}</p>}</div>
 </section>;
}
