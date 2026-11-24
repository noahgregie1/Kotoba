'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toHiragana } from 'wanakana';
import { BookOpen, CalendarDays, Check, CircleHelp, Clock3, Feather, Flower2, Gamepad2, Keyboard, Layers3, LibraryBig, PawPrint, Play, Sparkles, Sprout, Trophy, X } from 'lucide-react';
import { DURATION, MAX_LENGTH, type Judgment, type Mode, type Round } from '@/lib/game';
import { Habitat } from './Habitat';

async function post(body: object) {
  const response = await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Could not connect to the validator.');
  return data;
}

export default function Game({demo,day}:{demo:boolean;day:string}) {
  const [mode,setMode] = useState<Mode>('Learner');
  const [round,setRound] = useState<Round|null>(null);
  const [now,setNow] = useState(0);
  const [busy,setBusy] = useState(true);
  const [pending,setPending] = useState(0);
  const [word,setWord] = useState('');
  const [feedback,setFeedback] = useState('');
  const offset = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const help = useRef<HTMLDialogElement>(null);
  const storageKey = 'kotoba-round-'+day;
  const seconds = round ? Math.max(0,Math.ceil((round.start+DURATION-(round.gaveUpAt ?? now))/1000)) : 180;
  const ended = !!round && (round.gaveUpAt != null || seconds===0);
  const playing = !!round && !ended;
  const words = round?.words || [];
  useEffect(()=>{
    let cancelled = false;
    async function restore(){
      try {
        const id = localStorage.getItem(storageKey);
        if (!id) return;
        const res = await fetch('/api/game?id='+encodeURIComponent(id),{cache:'no-store'});
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        offset.current = data.now-Date.now();
        setNow(data.now); setRound(data.round); setMode(data.round.mode);
      } catch { /* Play remains available when browser storage is disabled. */ }
      finally { if (!cancelled) setBusy(false); }
    }
    void restore();
    return ()=>{cancelled=true;};
  },[storageKey]);
  useEffect(()=>{
    if (!playing) return;
    input.current?.focus();
    const interval = setInterval(()=>setNow(Date.now()+offset.current),150);
    return ()=>clearInterval(interval);
  },[playing]);
  async function start(){
    setBusy(true);setFeedback('');
    try {
      const data = await post({action:'start',mode});
      offset.current=data.now-Date.now();
      setNow(data.now);setRound(data.round);setWord('');
      try {localStorage.setItem(storageKey,data.round.id);} catch {}
    } catch {setFeedback('Could not start the round. Please try again.');}
    finally {setBusy(false);}
  }
  const converted = mode==='Learner' ? toHiragana(word.trim(), {passRomaji:false}) : word.trim();
  async function giveUp() {
    if (!playing || !round || busy) return;
    setBusy(true);
    try {
      const data = await post({action:'giveUp',id:round.id});
      setNow(data.now);
      setRound(current => current?.id === round.id ? {...current,gaveUpAt:data.round.gaveUpAt} : current);
      setWord('');
      setFeedback('');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not end the round. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function submit(e:FormEvent){
    e.preventDefault();
    if (!playing || busy || !round || !converted || Date.now()+offset.current>=round.start+DURATION) return;
    const submitted = converted;
    setWord('');setPending(n=>n+1);
    try {
      const data = await post({action:'submit',id:round.id,word:submitted});
      const j = data.judgment as Judgment;
      if(data.status==='accepted' || data.status==='duplicate'){
        setRound(prev=>prev && prev.id===round.id && !prev.words.some(w=>w.conceptId===j.conceptId) ? {...prev,words:[...prev.words,j]} : prev);
      }
      setFeedback(submitted+' · '+(data.status==='accepted'? '+10 points!':data.status==='duplicate'?'Already in your collection.':data.status==='uncertain'?'Uncertain. '+j.reason:j.reason));
    } catch(err){setFeedback(submitted+' · '+(err instanceof Error ? err.message : 'Connection error. Please retry.'));}
    finally {setPending(n=>n-1);input.current?.focus();}
  }
  const date = new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
  return <>
    <header><div className="nav"><div className="brand"><span className="logo" lang="ja">こ</span>Kotoba Daily <span className="jpbrand" lang="ja">ことばデイリー</span></div>
      <button className="help" onClick={()=>help.current?.showModal()}><CircleHelp size={17}/> How to play</button></div></header>
    <main><div className="page-title"><div className="eyebrow"><span className="smallrule"/> DAILY PLAY</div><h1>Daily challenge<span>.</span></h1></div>
      <div className="dateline"><CalendarDays size={16}/>{date}</div>
      <section className="hero"><div className="hero-copy"><div className="hero-label"><PawPrint size={16}/> TODAY’S CATEGORY</div><h2 lang="ja">動物</h2><div className="english">Animals</div><p>Name as many Japanese animal words as you can.</p></div><Habitat/></section>
      <div className="workspace"><section className="panel challenge">
        <div className="sectionTitle"><span className="iconTile"><Gamepad2/></span><h2>{ended?'Round results':'Play a round'}</h2>
          {playing && <button className="giveUp" type="button" disabled={busy} onClick={giveUp}>{busy?'Ending…':'Give up'}</button>}
        </div>
        {!ended && <><div className="fieldLabel">Game mode</div><div className="modes">{(['Learner','Fluent'] as Mode[]).map(m=><button key={m} aria-pressed={mode===m} disabled={playing || busy} onClick={()=>setMode(m)} className={mode===m?'selected':''}>
          {m==='Learner'?<Sprout size={21}/>:<Feather size={20}/>}<span>{m}</span>{mode===m&&<Check size={14}/>}</button>)}</div>
          <p className="modeHint"><Keyboard size={15}/>{mode==='Learner'?'Romaji-to-kana assistance is on.':'Enter words with your Japanese keyboard.'}</p></>}
        {ended && <p className="resultcopy" role="status">{round.gaveUpAt != null?'You ended the round early.':'Time’s up!'} {pending?'Finishing your submitted words…':words.length?'Your word collection is ready to review.':'Try another round to build your collection.'}</p>}
        <div className="stats"><div><Clock3/><section><small>TIME LEFT</small><strong>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong></section></div><div><Trophy/><section><small>SCORE</small><strong>{words.length*10}<em>pts</em></strong></section></div></div>
        {playing?<form onSubmit={submit}><label htmlFor="word">Your word</label><div className="entry"><input ref={input} id="word" lang="ja" maxLength={MAX_LENGTH} autoComplete="off" placeholder={mode==='Learner'?'Type in romaji or Japanese':'日本語で入力'} value={word} onChange={e=>setWord(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && (e.nativeEvent.isComposing || e.nativeEvent.keyCode===229)) e.preventDefault();}}/><button disabled={!converted}>Submit</button></div>{mode==='Learner'&& word && <small className="preview">Kana · {converted}</small>}</form>:
        <button className="primary" disabled={busy || pending>0} onClick={start}><Play size={18} fill="currentColor"/>{ended?'Play again':'Start round'}</button>}
        {(feedback || pending>0)&&<p role="status" className="feedback">{feedback} {pending>0&&'Checking '+pending+'…'}</p>}
      </section>
      <section className="panel collection"><div className="collectionHead"><div className="sectionTitle"><span className="iconTile"><LibraryBig/></span><h2>Word collection</h2></div><span className="count">{words.length}</span></div>
        {words.length?<ul>{[...words].reverse().map(w=><li key={w.conceptId}><div><strong lang="ja">{w.canonical}</strong> <small lang="ja">{w.reading}</small><p>{w.translation}</p></div><b>+10</b></li>)}</ul>:
        <div className="empty"><span className="bookart"><Sparkles size={16}/><BookOpen size={42} strokeWidth={1.5}/></span><strong>No words yet</strong><p>Your accepted words will appear here.</p></div>}</section></div>
      <footer><span><span className="statusdot"/>{demo?'Demo mode · Local validator':'AI mode · OpenAI validator'}</span><span><Flower2 size={16}/> ことばデイリー</span></footer>
    </main>
    <dialog ref={help}><button className="close" aria-label="Close instructions" onClick={()=>help.current?.close()}><X/></button><span className="iconTile"><Layers3/></span><h2>How to play</h2><ol><li>Choose Learner for romaji assistance or Fluent for direct Japanese input.</li><li>Start the timer and enter animal names for three minutes. Press Enter or Submit after each word.</li><li>Each unique concept earns 10 points. Species and breeds count separately. Alternate spellings count once.</li></ol><p>Use established names. Descriptions such as 大きい犬 (“big dog”) do not score. Words received before time expires can finish checking afterward.</p>{demo&&<p>The local demo checks a limited animal dictionary. Unlisted words receive an uncertain result.</p>}<button className="primary" onClick={()=>help.current?.close()}>Got it</button></dialog>
  </>;
}
