(function (global) {
  'use strict';

  const TAU = Math.PI * 2;
  const RADIUS = 0.24;
  const REACH = 3;
  const HEIGHT = 1.6;
  const DEFAULTS = {
    agent: [0.66, 1.78, 0.50], bench: [2, 0.94, 0.72], plant: [0.64, 1.22, 0.64],
    flower: [0.50, 0.66, 0.50], terminal: [0.72, 1.40, 0.62], receiver: [0.62, 1.06, 0.44],
    mirror: [1.02, 1.95, 0.24], door: [1.42, 2.58, 0.30], crate: [0.84, 0.76, 0.76],
    paper: [0.52, 0.76, 0.42], lamp: [0.50, 2.24, 0.50], panel: [1.00, 1.42, 0.24]
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
  const mix = (a, b, t) => a.map((n, i) => n * (1 - t) + b[i] * t);
  function color(value, fallback) {
    if (Array.isArray(value)) return value.slice(0, 3).map(n => clamp(n > 1 ? n / 255 : n, 0, 1));
    if (typeof value !== 'string') return fallback || [0.57, 0.54, 0.47];
    let s = value.replace('#', '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    if (/^[\da-f]{6}$/i.test(s)) return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
    const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return rgb ? rgb.slice(1, 4).map(n => clamp(Number(n) / 255, 0, 1)) : fallback || [0.57, 0.54, 0.47];
  }

  // Six independently shaded cube faces, all counterclockwise from the exterior.
  const FACES = [
    [[1, 0, 0], [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],
    [[-1,0,0], [[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],
    [[0,1,0], [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],
    [[0,-1,0], [[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],
    [[0,0,1], [[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]],
    [[0,0,-1], [[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]]
  ];
  function box(out, x, y, z, w, h, d, rgb) {
    if (!(w > 0 && h > 0 && d > 0)) return;
    for (const [normal, corners] of FACES) {
      for (const index of [0, 1, 2, 0, 2, 3]) {
        const v = corners[index];
        out.push(x + v[0] * w / 2, y + v[1] * h / 2, z + v[2] * d / 2,
          normal[0], normal[1], normal[2], rgb[0], rgb[1], rgb[2]);
      }
    }
  }
  function modelInfo(object) {
    const dims = DEFAULTS[object.kind] || DEFAULTS.crate;
    const w = Math.max(0.06, finite(object.w, dims[0]));
    const h = Math.max(0.06, finite(object.h, dims[1]));
    const d = Math.max(0.06, finite(object.d, dims[2]));
    const yaw = finite(object.yaw, 0), c = Math.abs(Math.cos(yaw)), sn = Math.abs(Math.sin(yaw));
    return Object.assign({}, object, {x: finite(object.x, 0), z: finite(object.z, 0), y: finite(object.y, h / 2), w, h, d, yaw, collisionW:c*w+sn*d, collisionD:sn*w+c*d});
  }
  // Objects face +Z at yaw 0; positive quarter turns face +X. Normals rotate
  // with vertices so lighting, geometry, and the collision footprint stay aligned.
  function rotateVertices(out, start, o) {
    if (!o.yaw) return;
    const c = Math.cos(o.yaw), sn = Math.sin(o.yaw);
    for (let i = start; i < out.length; i += 9) {
      const x = out[i] - o.x, z = out[i + 2] - o.z, nx = out[i + 3], nz = out[i + 5];
      out[i] = o.x + x*c + z*sn; out[i + 2] = o.z - x*sn + z*c;
      out[i + 3] = nx*c + nz*sn; out[i + 5] = -nx*sn + nz*c;
    }
  }
  function appendModel(out, o) {
    const start = out.length;
    const c = color(o.color, [0.38, 0.53, 0.51]);
    const dark = mix(c, [0.04, 0.07, 0.08], 0.64);
    const light = mix(c, [0.98, 0.90, 0.71], 0.43);
    const brass = [0.70, 0.53, 0.30];
    const ink = [0.07, 0.12, 0.14];
    const cream = [0.91, 0.84, 0.68];
    const b = (x,y,z,w,h,d,co) => box(out, o.x+x*o.w, o.y-o.h/2+y*o.h, o.z-z*o.d, w*o.w,h*o.h,d*o.d,co);
    switch (o.kind) {
      case 'agent':
        b(-.20,.18,0,.22,.36,.56,dark); b(.20,.18,0,.22,.36,.56,dark);
        b(-.20,.035,-.08,.28,.07,.78,ink); b(.20,.035,-.08,.28,.07,.78,ink);
        b(0,.54,0,.72,.40,.70,c); b(-.45,.51,0,.16,.36,.50,c); b(.45,.51,0,.16,.36,.50,c);
        b(-.45,.32,0,.15,.065,.46,cream); b(.45,.32,0,.15,.065,.46,cream);
        b(0,.77,0,.23,.10,.40,cream); b(0,.875,0,.56,.19,.64,cream);
        b(0,.982,.01,.61,.036,.69,dark); b(0,.94,.16,.59,.10,.28,dark);
        b(-.12,.884,-.33,.067,.025,.026,ink); b(.12,.884,-.33,.067,.025,.026,ink);
        b(0,.826,-.33,.14,.013,.027,brass); b(0,.735,-.37,.70,.06,.035,light);
        b(.20,.58,-.36,.13,.10,.027,brass);
        break;
      case 'bench':
        for (const x of [-.39,.39]) { b(x,.22,.24,.07,.44,.08,dark); b(x,.22,-.24,.07,.44,.08,dark); }
        b(0,.46,0,1,.10,1,c); b(0,.73,.42,1,.10,.14,light); b(0,.93,.42,1,.10,.14,c);
        b(-.46,.71,.42,.065,.55,.10,dark); b(.46,.71,.42,.065,.55,.10,dark);
        break;
      case 'plant': case 'flower':
        b(0,.13,0,.55,.26,.55,[.48,.29,.22]); b(0,.26,0,.67,.08,.67,[.62,.40,.29]);
        b(0,.30,0,.54,.015,.54,[.19,.19,.13]); b(0,.57,0,.055,.54,.055,dark);
        b(-.21,.58,0,.44,.075,.24,c); b(.19,.72,.05,.42,.075,.22,light);
        b(0,.82,.17,.23,.08,.38,c); b(-.12,.91,-.03,.25,.10,.25,light);
        if (o.kind === 'flower') {
          b(0,.96,0,.38,.085,.14,[.90,.64,.40]); b(0,.96,0,.14,.085,.38,[.90,.64,.40]);
          b(0,1.01,0,.13,.025,.13,cream);
        }
        break;
      case 'terminal':
        b(0,.05,0,.84,.10,.90,dark); b(0,.39,.12,.58,.65,.56,c);
        b(0,.77,0,1,.46,.66,dark); b(0,.80,-.342,.81,.30,.024,ink);
        b(-.12,.83,-.36,.46,.026,.014,[.50,.84,.73]); b(-.21,.77,-.36,.29,.016,.014,[.39,.60,.56]);
        b(.18,.71,-.36,.10,.025,.014,brass); b(0,.52,-.17,.85,.05,.62,light);
        for (let i=-2;i<=2;i++) b(i*.12,.552,-.33,.065,.013,.07,dark);
        break;
      case 'receiver':
        b(0,.25,0,.75,.50,.75,dark); b(0,.68,0,1,.40,1,c);
        b(-.14,.70,-.515,.41,.18,.018,ink); b(.30,.68,-.53,.12,.14,.04,brass);
        for (let i=0;i<4;i++) b(-.14,.64+i*.04,-.528,.34,.012,.012,light);
        b(.27,.94,.23,.03,.22,.03,brass);
        break;
      case 'mirror':
        b(0,.50,0,1,1,.60,dark); b(0,.52,-.32,.83,.88,.06,[.40,.57,.59]);
        b(-.35,.56,-.356,.017,.75,.012,[.69,.79,.74]); b(.34,.46,-.356,.018,.65,.012,[.52,.66,.65]);
        b(0,.08,-.36,.79,.04,.09,brass);
        break;
      case 'door':
        b(-.46,.5,0,.08,1,1,dark); b(.46,.5,0,.08,1,1,dark); b(0,.98,0,.88,.04,1,dark);
        b(0,.48,.10,.83,.95,.48,c); b(0,.73,-.155,.46,.24,.038,light);
        b(0,.73,-.18,.37,.17,.025,[.59,.71,.66]); b(.29,.43,-.19,.065,.045,.13,brass);
        b(0,.15,-.15,.64,.17,.035,dark);
        break;
      case 'paper':
        b(0,.025,0,.73,.05,.85,dark); b(0,.36,.15,.08,.71,.08,brass);
        b(0,.75,0,1,.06,1,c); b(0,.795,-.02,.83,.019,.78,cream);
        for (let i=0;i<4;i++) b(-.03,.807,-.23+i*.13,.53,.006,.026,[.41,.39,.31]);
        b(.27,.82,.22,.13,.025,.11,brass);
        break;
      case 'lamp':
        b(0,.025,0,.75,.05,.75,dark); b(0,.42,0,.07,.82,.07,brass);
        b(0,.88,0,1,.20,1,c); b(0,.79,0,.65,.025,.65,[1,.86,.55]); b(0,.988,0,.55,.03,.55,dark);
        break;
      case 'panel':
        b(0,.5,0,1,1,1,dark); b(0,.5,-.515,.86,.86,.025,c);
        b(0,.79,-.536,.59,.04,.015,cream);
        for (let i=0;i<3;i++) { b(-.20,.59-i*.13,-.54,.09,.038,.025,[.63,.81,.59]); b(.08,.59-i*.13,-.54,.31,.017,.015,light); }
        b(0,.09,-.55,.40,.025,.08,brass);
        break;
      default:
        b(0,.5,0,1,1,1,c); b(0,.12,-.51,1,.055,.028,dark); b(0,.88,-.51,1,.055,.028,dark);
        b(-.33,.5,-.515,.055,.82,.032,light); b(.33,.5,-.515,.055,.82,.032,light);
    }
    rotateVertices(out, start, o);
  }

  function create(canvas, options) {
    options = options || {};
    const call = (name, value) => { if (typeof options[name] === 'function') options[name](value); };
    let gl;
    try { gl = canvas.getContext('webgl', {alpha:false, antialias:true, powerPreference:'low-power'}); } catch (_) { /* reported below */ }
    const noop = () => {};
    if (!gl) {
      setTimeout(() => call('onError', 'This browser could not start WebGL. Enable hardware acceleration or try another browser to enter the 3D edition.'), 0);
      return {load:noop,pause:noop,getPosition:()=>({x:0,z:0,yaw:0,pitch:0}),setMove:noop,look:noop,interact:noop,sit:noop,destroy:noop};
    }
    let program;
    const shaders = [];
    try {
      function shader(type, source) {
        const s=gl.createShader(type); shaders.push(s); gl.shaderSource(s, source); gl.compileShader(s);
        if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      }
      program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER, `
        attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
        uniform mat4 uProjection; uniform mat4 uView; uniform vec3 uOffset;
        uniform vec3 uCamera; varying vec3 vColor; varying float vDistance;
        void main(){ vec3 p=aPosition+uOffset; vec3 light=normalize(vec3(-0.42,0.86,0.37));
          float diffuse=max(dot(aNormal,light),0.0); float hemisphere=0.08*aNormal.y;
          vColor=aColor*(0.70+0.27*diffuse+hemisphere); vDistance=distance(p,uCamera);
          gl_Position=uProjection*uView*vec4(p,1.0); }`));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER, `
        precision mediump float; varying vec3 vColor; varying float vDistance; uniform vec3 uFog;
        void main(){ float fog=smoothstep(8.0,28.0,vDistance); gl_FragColor=vec4(mix(vColor,uFog,fog*0.88),1.0); }`));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      shaders.forEach(s=>gl.deleteShader(s)); if(program) gl.deleteProgram(program);
      setTimeout(()=>call('onError','The 3D renderer could not initialize: '+error.message),0);
      return {load:noop,pause:noop,getPosition:()=>({x:0,z:0,yaw:0,pitch:0}),setMove:noop,look:noop,interact:noop,sit:noop,destroy:noop};
    }
    shaders.forEach(s=>gl.deleteShader(s));
    gl.useProgram(program); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    const uniforms={}; for(const name of ['uProjection','uView','uOffset','uCamera','uFog']) uniforms[name]=gl.getUniformLocation(program,name);
    const attrs=['aPosition','aNormal','aColor'].map(name=>gl.getAttribLocation(program,name));
    attrs.forEach(index=>gl.enableVertexAttribArray(index));
    const listeners=[]; const keys=new Set();
    let scene=null, bounds={minX:-6,maxX:6,minZ:-7,maxZ:7}, objects=[], colliders=[], batches=[];
    let pos={x:0,z:4,yaw:0,pitch:0}, paused=true, destroyed=false, focused=null, seated=false, seatedObject=null;
    let input={forward:0,strafe:0}, dragging=false, lastDrag=null, lastTime=0, frame=0, lastSave=0, dirty=false, wasMoving=false;
    let steps=0, currentHeight=HEIGHT, sky=[.13,.18,.20], fog=sky;
    let reducedMotion=!!options.reducedMotion;
    if (options.reducedMotion === undefined && global.matchMedia) reducedMotion=global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const listen=(target,type,handler,opts)=>{target.addEventListener(type,handler,opts);listeners.push(()=>target.removeEventListener(type,handler,opts));};
    const getPosition=()=>({x:pos.x,z:pos.z,yaw:pos.yaw,pitch:pos.pitch});
    function clearInput(){ keys.clear(); input.forward=0;input.strafe=0;dragging=false;lastDrag=null; }
    function releasePointer(){ if(document.pointerLockElement===canvas && document.exitPointerLock) document.exitPointerLock(); }
    function emitFocus(next){ if((next&&next.id)!==(focused&&focused.id)){ focused=next;call('onFocus',next); } else focused=next; }
    function makeBatch(vertices, animated, phase){ const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);return {buffer,count:vertices.length/9,animated,phase:phase||0}; }
    function collisionAt(x,z){
      if(x<bounds.minX+RADIUS||x>bounds.maxX-RADIUS||z<bounds.minZ+RADIUS||z>bounds.maxZ-RADIUS)return true;
      for(const b of colliders){
        if(b.y-b.h/2>1.75||b.y+b.h/2<.15)continue;
        const w=b.collisionW||b.w,d=b.collisionD||b.d;
        const dx=x-clamp(x,b.x-w/2,b.x+w/2), dz=z-clamp(z,b.z-d/2,b.z+d/2);
        if(dx*dx+dz*dz<RADIUS*RADIUS)return true;
      }
      return false;
    }
    function safePosition(candidate){
      const result={x:clamp(finite(candidate.x,0),bounds.minX+RADIUS,bounds.maxX-RADIUS),z:clamp(finite(candidate.z,4),bounds.minZ+RADIUS,bounds.maxZ-RADIUS),yaw:finite(candidate.yaw,0),pitch:clamp(finite(candidate.pitch,0),-1.12,1.12)};
      if(!collisionAt(result.x,result.z))return result;
      for(let r=.30;r<Math.max(bounds.maxX-bounds.minX,bounds.maxZ-bounds.minZ);r+=.30){
        for(let k=0;k<32;k++){const angle=k*TAU/32,x=result.x+Math.sin(angle)*r,z=result.z+Math.cos(angle)*r;if(!collisionAt(x,z))return Object.assign(result,{x,z});}
      }
      return result;
    }
    function load(next, saved){
      if(destroyed)return;
      batches.forEach(b=>gl.deleteBuffer(b.buffer));batches=[];scene=next||{};clearInput();emitFocus(null);seated=false;seatedObject=null;currentHeight=HEIGHT;
      bounds=Object.assign({minX:-6,maxX:6,minZ:-7,maxZ:7},scene.bounds||{});
      sky=color(scene.skyColor,[.13,.18,.20]);fog=color(scene.fogColor,sky);
      const floor=color(scene.floorColor,[.44,.42,.36]), walls=color(scene.wallColor,[.52,.54,.48]);
      const vertices=[];
      // Shallow floor slabs keep seams and feet grounded without textures or network assets.
      box(vertices,(bounds.minX+bounds.maxX)/2,-.08,(bounds.minZ+bounds.maxZ)/2,bounds.maxX-bounds.minX,.15,bounds.maxZ-bounds.minZ,mix(floor,[.18,.18,.15],.13));
      const tile=1.35;
      for(let x=bounds.minX;x<bounds.maxX;x+=tile){for(let z=bounds.minZ;z<bounds.maxZ;z+=tile){
        const w=Math.min(tile,bounds.maxX-x),d=Math.min(tile,bounds.maxZ-z),seed=Math.sin(x*17.23+z*6.43)*.5+.5;
        box(vertices,x+w/2,-.010,z+d/2,Math.max(.01,w-.014),.018,Math.max(.01,d-.014),mix(floor,[.7,.67,.57],seed*.045));
      }}
      colliders=[];
      for(const s of (scene.solids||[])){
        const b={x:finite(s.x,0),y:finite(s.y,finite(s.h,2.8)/2),z:finite(s.z,0),w:Math.max(.01,finite(s.w,1)),h:Math.max(.01,finite(s.h,2.8)),d:Math.max(.01,finite(s.d,1))};
        box(vertices,b.x,b.y,b.z,b.w,b.h,b.d,color(s.color,walls));if(s.solid!==false)colliders.push(b);
        if(b.h>2.3 && (b.w>.8||b.d>.8)) box(vertices,b.x,.12,b.z,b.w+.022,.22,b.d+.022,mix(color(s.color,walls),[.15,.20,.19],.38));
      }
      objects=(scene.objects||[]).map(modelInfo);
      const models=objects.concat((scene.decor||[]).map(o=>modelInfo(Object.assign({interactive:false,solid:false},o))));
      for(let i=0;i<models.length;i++){
        const o=models[i];
        if(o.solid!==false)colliders.push(o);
        // Two restrained contact shadow layers use opaque geometry above the floor.
        if(o.y-o.h/2<.10){
          const shadowStart=vertices.length;
          box(vertices,o.x,.001,o.z,o.w*1.15,.002,o.d*1.14,mix(floor,[.07,.10,.09],.13));
          box(vertices,o.x,.003,o.z,o.w*.87,.002,o.d*.83,mix(floor,[.07,.10,.09],.22));
          rotateVertices(vertices,shadowStart,o);
        }
        if(o.kind==='agent'){ const moving=[];appendModel(moving,o);batches.push(makeBatch(moving,true,i*1.7)); }
        else if(o.kind || !('w' in o && 'h' in o && 'd' in o))appendModel(vertices,o);
        else {const start=vertices.length;box(vertices,o.x,o.y,o.z,o.w,o.h,o.d,color(o.color,walls));rotateVertices(vertices,start,o);}
      }
      batches.unshift(makeBatch(vertices,false,0));
      pos=safePosition(saved||scene.spawn||{x:0,z:4,yaw:0});dirty=false;wasMoving=false;lastSave=performance.now();
      render(performance.now());if(!paused)updateFocus();
    }
    function rayBox(origin,dir,b,expand){
      const e=expand||0,w=b.collisionW||b.w,d=b.collisionD||b.d,min=[b.x-w/2-e,b.y-b.h/2-e,b.z-d/2-e],max=[b.x+w/2+e,b.y+b.h/2+e,b.z+d/2+e];
      let lo=0,hi=Infinity;
      for(let i=0;i<3;i++){
        if(Math.abs(dir[i])<.00001){if(origin[i]<min[i]||origin[i]>max[i])return Infinity;}
        else{let a=(min[i]-origin[i])/dir[i],c=(max[i]-origin[i])/dir[i];if(a>c){const t=a;a=c;c=t;}lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return Infinity;}
      }
      return lo;
    }
    function updateFocus(){
      if(paused||!scene){emitFocus(null);return;}
      const cp=Math.cos(pos.pitch),dir=[Math.sin(pos.yaw)*cp,Math.sin(pos.pitch),-Math.cos(pos.yaw)*cp],origin=[pos.x,currentHeight,pos.z];
      let nearest=null,distance=Infinity;
      for(const o of objects){
        if(o.interactive===false||!o.id||(seated&&o===seatedObject))continue;
        const horizontal=Math.hypot(o.x-pos.x,o.z-pos.z);
        if(horizontal>REACH+Math.max(o.w,o.d)/2)continue;
        const hit=rayBox(origin,dir,o,.11);
        if(hit>REACH||hit>=distance)continue;
        let obstructed=false;
        for(const solid of colliders){if(solid===o)continue;if(rayBox(origin,dir,solid,0)<hit-.13){obstructed=true;break;}}
        if(!obstructed){nearest=o;distance=hit;}
      }
      emitFocus(nearest);
    }
    function look(dx,dy){
      if(paused||destroyed)return;
      pos.yaw=(pos.yaw+finite(dx,0)*.0025)%TAU;pos.pitch=clamp(pos.pitch-finite(dy,0)*.0025,-1.12,1.12);dirty=true;
      updateFocus();
    }
    function interact(){ if(paused||destroyed)return;updateFocus();if(focused)call('onInteract',focused.id); }
    function pause(value){
      paused=!!value;clearInput();if(paused){releasePointer();emitFocus(null);if(dirty){call('onMove',getPosition());dirty=false;}}
      else updateFocus();
    }
    function setMove(forward,strafe){if(paused)return;input.forward=clamp(finite(forward,0),-1,1);input.strafe=clamp(finite(strafe,0),-1,1);}
    function sit(position){
      if(destroyed)return;
      if(position){seated=true;pos.x=finite(position.x,pos.x);pos.z=finite(position.z,pos.z);pos.yaw=finite(position.yaw,pos.yaw);pos.pitch=clamp(finite(position.pitch,0),-1.12,1.12);currentHeight=1.05;seatedObject=objects.find(o=>o.kind==='bench'&&Math.abs(o.x-pos.x)<(o.collisionW||o.w)/2+.12&&Math.abs(o.z-pos.z)<(o.collisionD||o.d)/2+.12)||null;}
      else{seated=false;seatedObject=null;currentHeight=HEIGHT;pos=safePosition(pos);}
      clearInput();dirty=false;updateFocus();
    }
    function render(now){
      if(!scene||destroyed)return;
      const ratio=Math.min(2,global.devicePixelRatio||1),width=Math.max(1,Math.round((canvas.clientWidth||640)*ratio)),height=Math.max(1,Math.round((canvas.clientHeight||360)*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.clearColor(sky[0],sky[1],sky[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      const aspect=width/height,f=1/Math.tan(Math.PI/5.4),near=.06,far=64;
      const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
      const sy=Math.sin(pos.yaw),cy=Math.cos(pos.yaw),sp=Math.sin(pos.pitch),cp=Math.cos(pos.pitch);
      const right=[cy,0,sy],up=[-sy*sp,cp,cy*sp],forward=[sy*cp,sp,-cy*cp];
      const bob=(!reducedMotion&&!paused&&wasMoving&&!seated)?Math.sin(steps)*.025:0;
      const camera=[pos.x,currentHeight+bob,pos.z];
      const dot=a=>a[0]*camera[0]+a[1]*camera[1]+a[2]*camera[2];
      const view=new Float32Array([right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,-dot(right),-dot(up),dot(forward),1]);
      gl.uniformMatrix4fv(uniforms.uProjection,false,projection);gl.uniformMatrix4fv(uniforms.uView,false,view);gl.uniform3fv(uniforms.uCamera,camera);gl.uniform3fv(uniforms.uFog,fog);
      for(const batch of batches){
        gl.bindBuffer(gl.ARRAY_BUFFER,batch.buffer);attrs.forEach((index,i)=>gl.vertexAttribPointer(index,3,gl.FLOAT,false,36,i*12));
        gl.uniform3f(uniforms.uOffset,0,batch.animated&&!reducedMotion&&!paused?Math.sin(now*.0018+batch.phase)*.009:0,0);gl.drawArrays(gl.TRIANGLES,0,batch.count);
      }
    }
    function tick(now){
      if(destroyed)return;
      const dt=Math.min(.04,Math.max(0,(now-(lastTime||now))/1000));lastTime=now;
      if(!paused&&scene){
        let forward=input.forward+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
        let strafe=input.strafe+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
        const turn=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);
        const tilt=(keys.has('PageUp')?1:0)-(keys.has('PageDown')?1:0);
        if(tilt){pos.pitch=clamp(pos.pitch+tilt*dt*1.25,-1.12,1.12);dirty=true;}
        const moving=Math.abs(forward)+Math.abs(strafe)>.001;
        if(turn){pos.yaw=(pos.yaw+turn*dt*1.8)%TAU;dirty=true;}
        if(moving){
          if(seated){seated=false;seatedObject=null;currentHeight=HEIGHT;pos=safePosition(pos);}
          const magnitude=Math.max(1,Math.hypot(forward,strafe));forward/=magnitude;strafe/=magnitude;
          const speed=2.25,dx=(Math.sin(pos.yaw)*forward+Math.cos(pos.yaw)*strafe)*speed*dt,dz=(-Math.cos(pos.yaw)*forward+Math.sin(pos.yaw)*strafe)*speed*dt;
          const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));const beforeX=pos.x,beforeZ=pos.z;
          for(let i=0;i<count;i++){if(!collisionAt(pos.x+dx/count,pos.z))pos.x+=dx/count;if(!collisionAt(pos.x,pos.z+dz/count))pos.z+=dz/count;}
          const moved=Math.hypot(pos.x-beforeX,pos.z-beforeZ);steps+=moved*7.4;if(moved>.00001)dirty=true;
        }
        if(dirty&&((!moving&&wasMoving)||now-lastSave>1000)){call('onMove',getPosition());lastSave=now;dirty=false;}
        wasMoving=moving;updateFocus();
      }
      render(now);frame=requestAnimationFrame(tick);
    }
    const editable=target=>target&&(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)||target.isContentEditable);
    listen(global,'keydown',event=>{
      if(paused||editable(event.target))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','KeyE'].includes(event.code)){
        event.preventDefault();if(event.code==='KeyE'){if(!event.repeat)interact();}else if(event.code==='Home'){pos.pitch=0;dirty=true;}else keys.add(event.code);
      }
    });
    listen(global,'keyup',event=>keys.delete(event.code));
    listen(global,'blur',()=>{clearInput();if(dirty){call('onMove',getPosition());dirty=false;}});
    listen(document,'visibilitychange',()=>{if(document.hidden){clearInput();releasePointer();}});
    listen(document,'pointerlockchange',()=>{if(document.pointerLockElement!==canvas)clearInput();});
    listen(document,'mousemove',event=>{if(document.pointerLockElement===canvas)look(event.movementX,event.movementY);});
    listen(canvas,'pointerdown',event=>{if(paused||event.button!==0||document.pointerLockElement===canvas)return;dragging=true;lastDrag={x:event.clientX,y:event.clientY,moved:0};if(canvas.setPointerCapture)canvas.setPointerCapture(event.pointerId);});
    listen(canvas,'pointermove',event=>{if(!dragging||!lastDrag||document.pointerLockElement===canvas)return;const dx=event.clientX-lastDrag.x,dy=event.clientY-lastDrag.y;lastDrag.moved+=Math.abs(dx)+Math.abs(dy);lastDrag.x=event.clientX;lastDrag.y=event.clientY;look(dx,dy);});
    listen(canvas,'pointerup',()=>{dragging=false;});
    listen(canvas,'pointercancel',()=>{dragging=false;lastDrag=null;});
    listen(canvas,'click',event=>{
      if(paused||event.button!==0)return;
      if(document.pointerLockElement===canvas){interact();return;}
      if(lastDrag&&lastDrag.moved>5){lastDrag=null;return;}
      if(canvas.requestPointerLock){try{const request=canvas.requestPointerLock();if(request&&request.catch)request.catch(()=>{});}catch(_){/* Drag look remains available. */}}
    });
    listen(canvas,'contextmenu',event=>event.preventDefault());
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();pause(true);call('onError','The 3D graphics context was interrupted. Reload the page to restore the scene; your saved progress is retained.');});
    function destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);clearInput();releasePointer();listeners.forEach(remove=>remove());batches.forEach(b=>gl.deleteBuffer(b.buffer));gl.deleteProgram(program);batches=[];emitFocus(null);}
    frame=requestAnimationFrame(tick);
    return {load,pause,getPosition,setMove,look,interact,sit,destroy,
      getDebugState:()=>({position:getPosition(),paused,seated,focused:focused?focused.id:null,solidCount:colliders.length,objectCount:objects.length,renderer:'WebGL'})};
  }
  global.Afterimage3DWorld={create};
})(window);
