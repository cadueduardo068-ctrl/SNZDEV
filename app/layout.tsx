import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://snz-dev.bloomygenet3.chatgpt.site'),title:'SNZ DEV — Sites que vão além.',description:'Desenvolvimento de sites modernos e personalizados. Transforme sua ideia em uma experiência digital.',openGraph:{title:'SNZ DEV',description:'Desenvolvimento de sites modernos e personalizados.',images:['/og.png'],locale:'pt_BR'},twitter:{card:'summary_large_image',images:['/og.png']},icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
