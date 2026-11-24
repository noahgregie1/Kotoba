import Game from '@/components/Game';
export const dynamic = 'force-dynamic';
export default function Page() {
  return <Game demo={!process.env.OPENAI_API_KEY} day={new Date().toISOString().slice(0,10)}/>;
}
