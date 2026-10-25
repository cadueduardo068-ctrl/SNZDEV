import type {projects} from '../db/schema';
export type Project=typeof projects.$inferSelect;
export const categories=['Todos','Sites institucionais','Landing pages','Lojas e catálogos','Projetos personalizados'];
export const stages:Record<string,string>={concept:'Conceito visual',review:'Em revisão',development:'Em desenvolvimento',preview:'Prévia privada',live:'Publicado'};
export const natures:Record<string,string>={conceptual:'Projeto conceitual',commercial:'Projeto comercial',authorial:'Projeto autoral',experimental:'Conceito experimental'};
export function whatsapp(phone:string,message='Olá, Cadu! Vi seu portfólio da SNZ DEV e gostaria de saber mais sobre seus serviços.'){return 'https://wa.me/'+phone+'?text='+encodeURIComponent(message)}
