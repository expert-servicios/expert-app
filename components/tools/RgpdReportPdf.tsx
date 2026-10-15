import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer';
import type { AepdToolId } from '@/lib/rgpd/aepd-tool-recommendation';

const styles=StyleSheet.create({
 page:{padding:40,fontSize:10,color:'#12243a',fontFamily:'Helvetica'},
 banner:{backgroundColor:'#0D1B2A',color:'#ffffff',padding:18,marginBottom:18},
 brand:{fontSize:13,fontWeight:'bold',color:'#D4A017',marginBottom:5},
 title:{fontSize:23,fontWeight:'bold',marginBottom:8},
 subtitle:{fontSize:11,marginBottom:5},
 h2:{fontSize:14,fontWeight:'bold',marginTop:14,marginBottom:7},
 body:{fontSize:10,lineHeight:1.55,marginBottom:6},
 item:{borderBottomWidth:0.5,borderBottomColor:'#dddddd',paddingVertical:8},
 link:{fontSize:9,color:'#245b98',marginTop:4},
 notice:{backgroundColor:'#f6f0e1',padding:12,marginTop:18},
 footer:{fontSize:8,color:'#67758a',position:'absolute',bottom:24,left:40,right:40},
});
export type RgpdReportTopic={title:string;why:string;action:string;guideUrl:string};
export type RgpdReportData={name:string;locale:'es'|'ru';date:string;primary:AepdToolId;toolTitle:string;toolUrl:string;topics:RgpdReportTopic[];extraReview:boolean};
const T={es:{title:'Guía inicial de protección de datos',prefix:'Preparada para',selected:'Herramienta AEPD de partida',plan:'Tu plan de acción',review:'Hay factores que requieren una evaluación adicional. Una respuesta no demuestra automáticamente incumplimiento ni obligación de EIPD.',why:'Qué significa',action:'Primer paso',training:'Formación guiada en EXPERT: 2 horas online, 180 € + IVA (217,80 € IVA incluido).',disclaimer:'Informe orientativo creado a partir de respuestas cerradas. No se han verificado sistemas, contratos ni datos reales. No constituye auditoría, EIPD, certificación oficial ni declaración de cumplimiento RGPD.',more:'Artículo y guía'},ru:{title:'Первоначальная памятка по RGPD',prefix:'Подготовлено для',selected:'Рекомендованный инструмент AEPD',plan:'План первых действий',review:'В ответах есть сложные или неясные вопросы, требующие дополнительной оценки. Сам опрос не устанавливает нарушение или необходимость EIPD.',why:'Что это означает',action:'Первый шаг',training:'Практическое обучение в EXPERT: 2 часа онлайн, 180 € + НДС (217,80 € с НДС).',disclaimer:'Предварительная памятка составлена по закрытым ответам. Системы, договоры и реальные документы не проверены. Это не аудит, не EIPD, не официальный сертификат и не подтверждение полного соблюдения RGPD.',more:'Открыть инструкцию'}};
export function RgpdReportPdf({data}:{data:RgpdReportData}){
 const t=T[data.locale];return <Document title={t.title} author="EXPERT Consulting · KIA" subject="RGPD orientation">
  <Page size="A4" style={styles.page} wrap>
    <View style={styles.banner}><Text style={styles.brand}>EXPERT · KIA</Text><Text style={styles.title}>{t.title}</Text><Text style={styles.subtitle}>{t.prefix}: {data.name}</Text><Text style={styles.subtitle}>{data.date}</Text></View>
    <Text style={styles.h2}>{t.selected}: {data.toolTitle}</Text><Link src={data.toolUrl} style={styles.link}>{data.toolUrl}</Link>
    {data.extraReview&&<View style={styles.notice}><Text style={styles.body}>{t.review}</Text></View>}
    <Text style={styles.h2}>{t.plan}</Text>
    {data.topics.map((topic,i)=><View key={i} style={styles.item} wrap={false}><Text style={styles.h2}>{i+1}. {topic.title}</Text><Text style={styles.body}>{t.why}: {topic.why}</Text><Text style={styles.body}>{t.action}: {topic.action}</Text><Link src={topic.guideUrl} style={styles.link}>{t.more}: {topic.guideUrl}</Link></View>)}
    <View style={styles.notice}><Text style={styles.body}>{t.training}</Text><Link src={data.locale==='ru'?'https://expertconsulting.es/ru/uslugi/obuchenie-rgpd':'https://expertconsulting.es/servicios/empresas-autonomos/formacion-rgpd-aepd'} style={styles.link}>EXPERT — RGPD</Link><Text style={styles.body}>{t.disclaimer}</Text></View>
    <Text style={styles.footer}>EXPERT Consulting · expertconsulting.es · 15/10/2026 · RGPD / AEPD</Text>
  </Page>
 </Document>
}
