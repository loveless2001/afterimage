(function(root){
  'use strict';
  function create({onChange=()=>{},onError=()=>{}}={}){
    let context=null,master=null,bed=null,enabled=false,active=false,busy=false,chapter=0;
    let volume=.65,wanted=false;
    const tones=[],effects=new Set();
    try{
      wanted=localStorage.getItem('afterimage.score.sound')==='on';
      const saved=localStorage.getItem('afterimage.score.volume');
      if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(1,Number(saved)));
    }catch(_){}
    const state=()=>({enabled,running:context?.state==='running',busy,volume:Math.round(volume*100),wanted});
    const notify=()=>onChange(state());
    function sync(){
      if(!context||!master)return;
      const now=context.currentTime;
      master.gain.setTargetAtTime(enabled&&!document.hidden?volume:0,now,.04);
      bed.gain.setTargetAtTime(active?.15:0,now,.15);
      tones.forEach((tone,i)=>tone.frequency.setTargetAtTime([110,220,330][i]+(chapter>=3?i*.8:0),now,.2));
    }
    function ensure(){
      if(context&&context.state!=='closed')return;
      const Native=window.AudioContext||window.webkitAudioContext;
      if(!Native)throw Error('Audio is unavailable in this browser.');
      context=new Native();master=context.createGain();master.gain.value=0;master.connect(context.destination);
      bed=context.createGain();bed.gain.value=0;bed.connect(master);tones.length=0;
      [110,220,330].forEach((frequency,i)=>{
        const tone=context.createOscillator(),gain=context.createGain();tone.type='sine';tone.frequency.value=frequency;
        gain.gain.value=.45/(i+1);tone.connect(gain).connect(bed);tone.start();tones.push(tone);
      });
      context.addEventListener('statechange',notify);
    }
    function chime(){
      if(!enabled||context?.state!=='running')return;
      [440,554.37,659.25].forEach((frequency,i)=>{
        const tone=context.createOscillator(),gain=context.createGain(),at=context.currentTime+.01+i*.14;
        tone.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.2,at+.02);
        gain.gain.exponentialRampToValueAtTime(.001,at+.42);tone.connect(gain).connect(master);
        effects.add(tone);tone.start(at);tone.stop(at+.44);
        tone.onended=()=>{effects.delete(tone);tone.disconnect();gain.disconnect();};
      });
    }
    async function setEnabled(on,confirm=true){
      if(busy)return false;busy=true;notify();
      try{
        if(on){
          ensure();master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(0,context.currentTime);
          await context.resume();
          if(context.state!=='running')throw Error('Playback is paused. Press Play test chime to try again.');
        }
        enabled=on;wanted=on;sync();
        if(!on&&context){for(const tone of effects)tone.stop();await context.suspend();}
        try{localStorage.setItem('afterimage.score.sound',on?'on':'off');}catch(_){}
        if(on&&confirm)chime();return true;
      }catch(error){enabled=false;sync();onError(error.message);return false;}
      finally{busy=false;notify();}
    }
    document.addEventListener('visibilitychange',sync);
    return {
      state,
      toggle:()=>setEnabled(!(enabled&&context?.state==='running')),
      restore:()=>wanted?setEnabled(true):Promise.resolve(false),
      async test(){
        if(!enabled||context?.state!=='running'){if(!await setEnabled(true,false))return;}
        if(volume===0){onError('Sound volume is 0%. Raise the volume slider, then play the test chime.');return;}
        chime();
      },
      chime,
      setVolume(percent){if(!Number.isFinite(percent))return;volume=Math.max(0,Math.min(100,percent))/100;try{localStorage.setItem('afterimage.score.volume',String(volume));}catch(_){}sync();notify();},
      setScene(isActive,index){active=isActive;chapter=index;sync();}
    };
  }
  root.AfterimageScoreAudio={create};
})(window);
