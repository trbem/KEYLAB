import { Slot } from '@/lib/types';
export default function PartVisual({slot,color='#a795d2'}:{slot:Slot;color?:string}){
 const blocks=Array.from({length:32},(_,i)=><rect key={i} x={20+(i%8)*13} y={20+Math.floor(i/8)*13} width="9" height="8" rx="1" fill={i%7===0?'#aaa0d5':'#dddbea'}/>);
 return <svg className="part-art" viewBox="0 0 150 100" aria-hidden="true"><g transform="translate(5 6) rotate(-9 70 48)">
 {slot==='keycaps'?<><path d="M13 26 125 26 137 67 24 67Z" fill="#28293c"/>{blocks}</>:null}
 {slot==='switches'?<><path d="M37 28 91 21 115 36 63 44Z" fill="#eeeaff" opacity=".85"/><path d="M37 28 63 44 63 78 37 60Z" fill={color}/><path d="M63 44 115 36 115 69 63 78Z" fill="#8b7baa"/><path d="M64 24 81 22 84 28 94 27 96 35 85 36 87 43 73 45 71 38 61 39 59 32 68 31Z" fill="#d8c8fc"/><path d="M48 50 54 54M48 57 54 61M79 53 105 49" stroke="#d7cbed" strokeWidth="2" opacity=".7"/></>:null}
 {slot==='pcb'||slot==='plate'?<><path d="M13 25 115 14 136 57 33 72Z" fill={slot==='pcb'?'#252b35':color} stroke="#a69cbc" strokeWidth="3"/>{Array.from({length:32},(_,i)=><rect key={i} x={26+i%8*12} y={25+Math.floor(i/8)*9} width="6" height="5" rx="1" fill={slot==='pcb'?'#a5a3b0':'#30303c'}/>)}<circle cx="19" cy="27" r="2" fill="#e2daee"/><circle cx="124" cy="58" r="2" fill="#e2daee"/></>:null}
 {slot==='case'?<><path d="M16 32 111 21 136 36 37 49Z" fill="#d7caed"/><path d="M37 49 136 36 133 62 35 75Z" fill={color}/><path d="M16 32 37 49 35 75 13 57Z" fill="#776b97"/><path d="M28 34 109 25 124 36 40 45Z" fill="#222333"/><path d="M46 54 124 44" stroke="#eee7ff" opacity=".35" strokeWidth="2"/></>:null}
 {slot==='case_foam'||slot==='plate_foam'||slot==='switch_pad'?<><path d="M19 31 111 22 133 38 39 49Z" fill={color}/><path d="M18 43 110 34 132 50 38 61Z" fill="#707080"/><path d="M18 55 110 46 132 62 38 73Z" fill="#4d4c5b"/><path d="M38 61 132 50M39 49 133 38" stroke="#aaa5b6" opacity=".5"/></>:null}
 {slot==='stabilizers'?<><path d="M30 43 45 37 56 43 56 65 44 70 30 63Z" fill="#d5d0e6"/><path d="M91 36 106 30 117 36 117 58 105 63 91 56Z" fill="#a59bbb"/><path d="M47 46 Q72 26 103 40" fill="none" stroke="#c6c1d4" strokeWidth="4"/><path d="M47 50 47 58M105 42 105 51" stroke="#777181" strokeWidth="3"/></>:null}
 </g></svg>
}
