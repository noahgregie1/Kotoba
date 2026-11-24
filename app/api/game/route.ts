import { storage } from '@/lib/storage';
import { judge } from '@/lib/validator';
import { MAX_LENGTH, normalize, onTime } from '@/lib/game';

export const runtime = 'nodejs';
function error(message: string, status: number) {
  return Response.json({status:'error',message},{status});
}
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') || '';
  const round = storage().round(id);
  return round ? Response.json({round,now:Date.now()},{headers:{'Cache-Control':'no-store'}}) : error('Round not found.',404);
}
export async function POST(req: Request) {
  const received = Date.now();
  const db = storage();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (!db.allow('ip/'+ip,received,100)) return error('Too many requests. Try again in a minute.',429);
  if (Number(req.headers.get('content-length')) > 1024) return error('Submission is too long.',413);
  const raw = await req.text();
  if (raw.length > 1024) return error('Submission is too long.',413);
  let body;
  try { body = JSON.parse(raw); } catch { return error('Expected a JSON submission.',400); }
  if (!body || typeof body !== 'object') return error('Invalid submission.',400);
  if (body.action === 'start' && ['Learner','Fluent'].includes(body.mode)) {
    return Response.json({round:db.start(body.mode,received), now:received});
  }
  if (body.action === 'giveUp' && typeof body.id === 'string') {
    const round = db.giveUp(body.id, received);
    return round ? Response.json({round, now:received}) : error('Round not found.',404);
  }
  if (body.action !== 'submit' || typeof body.id !== 'string' || typeof body.word !== 'string') return error('Invalid submission.',400);
  const round = db.round(body.id);
  if (!round) return error('Round not found.',404);
  if (!onTime(round.start,received,round.gaveUpAt)) return error('This round has ended.',409);
  if (!db.allow('round/'+round.id,received,70)) return error('Too many submissions. Try again in a minute.',429);
  const word = body.word.normalize('NFKC').trim();
  if (!word || word.length > MAX_LENGTH || !/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々ヶ・]+$/u.test(normalize(word))) return error('Enter one Japanese word, up to 48 characters.',400);
  try {
    const judgment = await judge(word);
    const status = judgment.valid === null ? 'uncertain' : !judgment.valid ? 'invalid' : db.award(round.id,judgment) ? 'accepted' : 'duplicate';
    return Response.json({status,judgment,received});
  } catch {
    return error('Validation is unavailable. Please try this word again.',503);
  }
}
