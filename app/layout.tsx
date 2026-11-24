import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Kotoba Daily · ことばデイリー',description:'A daily three-minute Japanese vocabulary game.'};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
