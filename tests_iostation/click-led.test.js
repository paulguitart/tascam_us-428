const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const state={},messages=[],ctx={getState:k=>state[k]||'',setState:(k,v)=>state[k]=v};
let metronome=0;
const s={Date,ENABLE_MIDI_OUTPUT_CACHE:true,cClick:0x3B,metronomeFeedbackValue:null,
 midiOut:{sendMidi:(_,m)=>messages.push(Array.from(m))},hostMetronomeActive:{},
 surface:{makeCustomValueVariable:()=>({getProcessValue:()=>metronome})},page:{makeValueBinding(){}},
 updateMetronomeModeLEDs(){},updateBypassLED(){}};
vm.createContext(s);
for(const name of ['sendHardwareMidi','offLED','onLED','flashingLED','setTransportLed','updateClickLED','setupMetronomeFeedback']){
 const start=source.indexOf('function '+name+'(');assert(start>=0);let end=source.indexOf('{',start),depth=1;
 for(end++;depth;end++){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;}
 vm.runInContext(source.slice(start,end),s);
}
s.updateClickLED(ctx);assert.deepEqual(messages.at(-1),[0x90,0x3B,0]);
s.setupMetronomeFeedback();
for(const mode of ['Pan','Send','Mouse','MouseFader','Zoom','Section','Marker','HighPass','PreGain','Master','Click']){
 state.knobMode=mode;
 for(const value of [0,1,0]){
  metronome=value;s.metronomeFeedbackValue.mOnProcessValueChange(ctx,value);
  assert.deepEqual(messages.at(-1),[0x90,0x3B,mode==='Click'?1:value?127:0]);
  const count=messages.length;s.updateClickLED(ctx);assert.equal(messages.length,count);
 }
}
for(const value of [0,1]){
 metronome=value;state.knobMode='Click';s.updateClickLED(ctx);assert.equal(messages.at(-1)[2],1);
 state.knobMode='Pan';s.updateClickLED(ctx);assert.equal(messages.at(-1)[2],value?127:0);
}
console.log('PASS: global CLICK on/off follows host metronome, Click-mode flash overrides it, mode exit restores status, null startup and MIDI caching');
