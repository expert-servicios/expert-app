import Link from 'next/link';
type Section = {heading:string;body:string};
function LinkedParagraph({body}:{body:string}){
 const chunks=body.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
 return <p className="mt-4 text-base leading-8 text-[#23364D]">{chunks.map((chunk,index)=>{
 const match=chunk.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
 return match?<a key={index} href={match[2]} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#A97600] underline">{match[1]}</a>:<span key={index}>{chunk}</span>;
 })}</p>;
}
export function RuLaborArticleSections({sections}:{sections:Section[]}){
 return <div className="space-y-12">{sections.map(s=><section key={s.heading}><h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{s.heading}</h2><LinkedParagraph body={s.body}/></section>)}</div>;
}
