import {requireChatGPTUser} from '../chatgpt-auth';
import {authorized} from '../api/admin/route';
import Admin from './panel';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/admin');if(!await authorized())return <main className="admin"><a href="/">← SNZ DEV</a><h1>Painel protegido</h1><p>Seu acesso administrativo ainda não está configurado. Defina ADMIN_EMAIL com o e-mail da conta do Cadu nas variáveis de ambiente do servidor. Nenhum visitante pode editar o portfólio.</p></main>;return <Admin/>}
