import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
import { exampleAtScore, exampleStart, exampleTrade } from '../../lib/chart-math.mjs';
import { useReducedMotion } from './useReducedMotion';

const graphSamples = Array.from({ length: 241 }, (_, i) => exampleAtScore(-3 + i / 40))
  .filter(p => p.yes >= 0 && p.yes <= 2000).reverse();
const gx = (yes: number) => 62 + yes / 2000 * 494;
const gy = (probability: number) => 242 - probability * 195;
const graphPath = graphSamples.map((p, i) => `${i ? 'L' : 'M'}${gx(p.yes).toFixed(2)},${gy(p.probability).toFixed(2)}`).join(' ');
const sequence: ['YES' | 'NO', number][] = [['YES', 100], ['YES', 200], ['NO', 150]];
const count = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

export function TradeExplainer() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const model = useRef(exampleStart());
  const displayRef = useRef(0);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [auto, setAuto] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [size, setSize] = useState(100);
  const [error, setError] = useState('');
  const [trade, setTrade] = useState<{ side: 'YES' | 'NO'; input: number; output: number; before: number; after: number; id: number }>();
  const serial = useRef(0);
  const display = exampleAtScore(score);
  const updateDisplay = (value: number) => { displayRef.current = value; setScore(value); };

  useEffect(() => {
    if (paused) return;
    if (reduced || Math.abs(displayRef.current-target) < 1e-10) { updateDisplay(target); setAnimating(false); return; }
    let frame = 0;
    const from = displayRef.current;
    const start = performance.now();
    setAnimating(true);
    const tick = (now: number) => {
      const progress = Math.min(1, (now-start)/850);
      const eased = 1-Math.pow(1-progress,3);
      updateDisplay(from + (target-from)*eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setAnimating(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, paused, reduced]);

  useEffect(() => {
    if (!auto || paused || animating) return;
    if (step >= sequence.length) { setAuto(false); return; }
    const timer = setTimeout(() => { execute(...sequence[step]); setStep(value => value+1); }, step === 0 ? 400 : 2000);
    return () => clearTimeout(timer);
  }, [auto, paused, animating, step]);

  useEffect(() => {
    if (!auto) return;
    const visibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) setPaused(true); });
    if (root.current) observer.observe(root.current);
    return () => { document.removeEventListener('visibilitychange', visibility); observer.disconnect(); };
  }, [auto]);
  useEffect(() => { if (reduced) { setAuto(false); setPaused(false); } }, [reduced]);

  function execute(side: 'YES' | 'NO', input: number) {
    try {
      const previous = model.current;
      const before = exampleAtScore((previous.no-previous.yes)/previous.liquidity).probability;
      const next = exampleTrade(previous, side, input);
      if (next.yes > 2000 || next.no > 2000) throw new Error('Reset the example to keep the trade inside this graph’s range.');
      model.current = next;
      setAnimating(!reduced);
      setTarget((next.no-next.yes)/next.liquidity);
      setTrade({ side, input, output: next.output, before, after: next.probability, id: ++serial.current });
      setError('');
    } catch (e) { setError((e as Error).message); setAuto(false); }
  }
  function reset() {
    model.current = exampleStart();
    updateDisplay(0); setTarget(0); setAnimating(false); setAuto(false); setPaused(false); setStep(0); setTrade(undefined); setError('');
  }
  function playback() {
    if (auto) { setPaused(value => !value); return; }
    if (reduced) { execute(...sequence[step % sequence.length]); setStep(value=>value+1); return; }
    reset(); setAuto(true);
  }
  return (
    <section ref={root} className="trade-explainer surface" aria-labelledby="trade-example-title">
      <div className="chart-title-row"><h2 id="trade-example-title">See a trade change the price.</h2><span className="chart-source">Interactive example</span></div>
      <p className="explainer-intro">Buy YES and fewer YES tokens remain in the maker’s position. The implied YES price rises. Buy NO to move it the other way.</p>
      <div className="explainer-layout">
        <div className="example-graph-wrap">
          <div className="example-price"><strong data-testid="example-probability">{(display.probability*100).toFixed(1)}%</strong><span>implied YES probability</span></div>
          <svg className="example-price-graph" viewBox="0 0 600 305" role="img" aria-label={`Example pricing curve. Maker holds ${count(display.yes)} YES tokens; implied YES probability ${(display.probability*100).toFixed(1)} percent.`}>
            {[0,.25,.5,.75,1].map(p=><g key={p}><line x1="62" x2="556" y1={gy(p)} y2={gy(p)} className="graph-grid"/><text x="48" y={gy(p)+5} textAnchor="end">{p*100}%</text></g>)}
            <path d={graphPath} className="example-curve-line" />
            <line x1={gx(display.yes)} x2={gx(display.yes)} y1={gy(display.probability)} y2="242" className="graph-crosshair" />
            <line x1="62" x2={gx(display.yes)} y1={gy(display.probability)} y2={gy(display.probability)} className="graph-crosshair" />
            <circle cx={gx(1000)} cy={gy(.5)} r="4" className="starting-dot" />
            <circle data-testid="example-marker" cx={gx(display.yes)} cy={gy(display.probability)} r="8" className="selected-dot" />
            {[0,500,1000,1500,2000].map(n=><text key={n} x={gx(n)} y="269" textAnchor="middle">{n.toLocaleString()}</text>)}
            <text x="309" y="300" textAnchor="middle">YES tokens in the maker’s position</text>
          </svg>
          <p className="chart-note">Each point lies on the same static pm-AMM curve. The dot moves along it as the example trades change the token balances.</p>
        </div>
        <div className="example-controls">
          <div className="example-inventory" aria-label="Example maker balances"><div><span>Maker’s YES</span><strong>{count(display.yes)}</strong></div><div><span>Maker’s NO</span><strong>{count(display.no)}</strong></div></div>
          <div className="example-trade-story" aria-live="polite" aria-atomic="true">
            {trade ? <><strong>Example trader buys {trade.side}</strong><p>{count(trade.input)} {trade.side === 'YES' ? 'NO' : 'YES'} paid <ArrowRight size={14} /> {count(trade.output)} {trade.side} received</p><p>YES price: {(trade.before*100).toFixed(1)}% → {(trade.after*100).toFixed(1)}%</p></> : <><strong>Start with an even market.</strong><p>The maker has 1,000 YES and 1,000 NO. Neither outcome is favored by this starting price.</p></>}
          </div>
          <label className="example-size">Example trade size <output>{size} tokens</output><input aria-label="Example trade size" type="range" min="10" max="300" step="10" value={size} onChange={event=>setSize(Number(event.target.value))} disabled={auto || animating}/></label>
          <div className="example-trade-buttons"><button className="button secondary" disabled={auto || animating} onClick={()=>execute('YES',size)}>Example: buy YES</button><button className="button secondary" disabled={auto || animating} onClick={()=>execute('NO',size)}>Example: buy NO</button></div>
          <div className="example-playback"><button className="button primary" onClick={playback}>{auto && !paused ? <Pause size={16}/> : <Play size={16}/>} {reduced ? 'Next example trade' : auto ? paused ? 'Resume walkthrough' : 'Pause walkthrough' : 'Play walkthrough'}</button><button className="icon-button" aria-label="Reset trade example" onClick={reset}><RotateCcw size={17}/></button></div>
          {error && <p className="history-notice" role="status">{error}</p>}
          <p className="chart-note">Illustration only. Uses the ideal research curve, with no wallet transactions or gas. Real quotes include the contract’s numerical rounding and limits.</p>
        </div>
      </div>
    </section>
  );
}

export function TimePlayback({ remaining, onChange }: { remaining: number; onChange: (value: number) => void }) {
  const reduced = useReducedMotion();
  const [playing,setPlaying] = useState(false);
  const value = useRef(remaining); value.current = remaining;
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!playing || reduced) return;
    let frame=0;
    const from=value.current <= 5 ? 100 : value.current;
    const started=performance.now();
    const tick=(now:number)=>{
      const progress=Math.min(1,(now-started)/7000);
      onChange(Math.round(from+(5-from)*progress));
      if(progress<1) frame=requestAnimationFrame(tick); else setPlaying(false);
    };
    frame=requestAnimationFrame(tick);
    const stop=()=>{if(document.hidden)setPlaying(false);};
    const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)setPlaying(false);});
    if(button.current)observer.observe(button.current);
    document.addEventListener('visibilitychange',stop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',stop);};
  },[playing,reduced,onChange]);
  return <button ref={button} className="button secondary time-playback" onClick={()=>reduced ? onChange(remaining > 25 ? remaining-25 : 100) : setPlaying(v=>!v)}>{playing && !reduced ? <Pause size={15}/> : <Play size={15}/>} {reduced ? 'Advance time example' : playing ? 'Pause time example' : 'Play time example'}</button>;
}
