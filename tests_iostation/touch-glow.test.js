// Test TOUCH appearance independently of Cubase and of fader control logic.
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','PreSonus_IOStation.js'),'utf8');
const state={},ctx={getState:k=>state[k]||''};let level=.5,color,brightness,lit;
const s={ENABLE_VOLUME_TOUCH_GLOW:true,ENABLE_CLICK_TOUCH_GLOW:true,TOUCH_GLOW_LOW_COLOR:[1,2,3],TOUCH_GLOW_BOTTOM_COLOR:[11,22,33],TOUCH_GLOW_HIGH_COLOR:[4,5,6],TOUCH_CLICK_GLOW_COLOR:[7,8,9],TOUCH_GLOW_MIN_BRIGHTNESS:.03,FADER_HOST_UNITY:.75,
 WHITE:[127,127,127],RED:[127,0,0],AMBER:[127,48,0],GREEN:[0,127,0],CYAN:[0,127,127],MAGENTA:[127,0,127],LINK_LOWER_COLOR:[127,0,40],cTouch:1,
 isMouseLinkMode:m=>m==='Mouse'||m==='MouseFader',clampFader:v=>Math.max(0,Math.min(1,v)),
 faderTargetFeedback:{},setRGBLED_color:(_,n,c,b=1)=>{color=Array.from(c);brightness=b},setTransportLed:(_,n,on)=>lit=on,
 mouseLockFeedbackValue:{getProcessValue:()=>1},mouseParameterFeedbackValue:{getProcessValue:()=>level}};
vm.createContext(s);vm.runInContext(source.slice(source.indexOf('function updateTouchLED('),source.indexOf('function resetCurrentFader(')),s);
function check(target,v,c,b,on=true){state.faderTarget=target;level=v;s.faderTargetFeedback[target]={getProcessValue:()=>level};s.updateTouchLED(ctx);assert.equal(lit,on);if(on){assert.equal(color.length,c.length);color.forEach((v,i)=>assert(Math.abs(v-c[i])<1e-10));assert(Math.abs(brightness-b)<1e-10)}}
for(const target of ['Track','Send','StereoOut','FXReturn','PreGain']){
 const u=target==='PreGain'?.5:.75;
 for(const fraction of [0,.25,.5,.999]){
  const d=1-fraction;
  const c=target==='PreGain'?[1,2,3]:[1+10*d,2+20*d,3+30*d];
  check(target,u*fraction,c,.03+.97*fraction);
 }
 for(const [v,c,b] of [[u,[127,127,127],1],[u+.001,[4,5,6],.03+.97*.001/(1-u)],[u+(1-u)/2,[4,5,6],.515],[1,[4,5,6],1]])check(target,v,c,b);
}
// SHIFT+PAN uses pre/post hue below unity, not the configurable blend.
state.knobMode='Send';
for(const pre of [0,1]){
 s.firstSendPrePostFeedbackValue={getProcessValue:()=>pre};
 for(const fraction of [0,.25,.5,.999])check('Send',.75*fraction,pre?s.CYAN:s.AMBER,.03+.97*fraction);
 check('Send',.75,s.WHITE,1);check('Send',.875,[4,5,6],.515);check('Send',1,[4,5,6],1);
}
state.knobMode='';
// Equal endpoint colors produce just a dimming ramp.
s.TOUCH_GLOW_BOTTOM_COLOR=s.TOUCH_GLOW_LOW_COLOR;
for(const fraction of [0,.25,.5,.9])check('Track',.75*fraction,[1,2,3],.03+.97*fraction);
for(const v of [0,.25,.5,1])check('Metronome',v,[7,8,9],.03+.97*v);
s.ENABLE_VOLUME_TOUCH_GLOW=false;s.ENABLE_CLICK_TOUCH_GLOW=false;
for(const target of ['Track','Send','StereoOut','FXReturn']){check(target,0,s.AMBER,1);check(target,.75,s.WHITE,1);check(target,1,s.RED,1);check(target,.4,null,0,false)}
check('Metronome',1,s.RED,1);check('Metronome',.5,null,0,false);
check('PreGain',.25,[1,2,3],.515); // Mandatory even with both optional flags off.
for(const mode of ['Mouse','MouseFader'])for(const flags of [false,true]){
 state.knobMode=mode;state.mouseStartingValue='.5';s.ENABLE_VOLUME_TOUCH_GLOW=flags;s.ENABLE_CLICK_TOUCH_GLOW=flags;
 for(const [v,c] of [[.4,s.LINK_LOWER_COLOR],[.5,s.GREEN],[.6,s.MAGENTA]])check('Mouse',v,c,1);
 state.mouseStartingValue='';check('Mouse',.4,null,0,false);
}
console.log('PASS: configurable TOUCH colors, both sides of unity, CLICK green ramp, optional legacy behavior, mandatory PreGain and unchanged LINK');
