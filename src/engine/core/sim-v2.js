import {CircuitEngine as BaseCircuitEngine} from './sim.js?base=1';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export class CircuitEngine extends BaseCircuitEngine{
  build(dt){
    const N=super.build(dt);
    const removePart=(arr,part)=>{
      for(let i=arr.length-1;i>=0;i--){
        const e=arr[i];
        if(e?.meta?.part===part||e?.part===part)arr.splice(i,1);
      }
    };
    const root=N.root;
    const T=(id,pin)=>`${id}:${pin}`;
    const pushR=(a,b,r,part)=>N.R.push({a:root(a),b:root(b),r:Math.max(Number(r)||1e12,1e-6),meta:{part,enhanced:true}});
    const pushV=(a,b,v,part)=>N.V.push({a:root(a),b:root(b),v:Number(v)||0,meta:{part,enhanced:true}});

    for(const p of this.scene.parts.values()){
      const id=p.userData.id,q=p.userData.params,type=p.userData.type;
      if(type==='npn'||type==='pnp'){
        removePart(N.R,p); removePart(N.diodes,p);
        const vb=this.getPinVoltage(id,'B'),ve=this.getPinVoltage(id,'E');
        const vbe=type==='npn'?vb-ve:ve-vb;
        const drive=clamp((vbe-.52)/.28,0,1);
        const beta=Math.max(10,Number(q.beta)||100);
        const ron=Math.max(.22,72/beta);
        const rce=drive<=0?1e9:ron+(1-drive)*Math.min(2e6,2200/Math.max(drive,.001));
        pushR(T(id,'C'),T(id,'E'),rce,p);
        N.diodes.push({
          a:root(T(id,type==='npn'?'B':'E')),
          b:root(T(id,type==='npn'?'E':'B')),
          is:8e-13,n:1.55,part:p,enhanced:true
        });
      }
      if(type==='timer555'){
        removePart(N.R,p); removePart(N.V,p);
        const gnd=this.getPinVoltage(id,'1');
        const vcc=Math.max(.1,this.getPinVoltage(id,'8')-gnd);
        const trigger=this.getPinVoltage(id,'2')-gnd;
        const threshold=this.getPinVoltage(id,'6')-gnd;
        const reset=this.getPinVoltage(id,'4')-gnd;
        const controlPin=p.userData.terminals?.['5'];
        const controlConnected=controlPin?this.scene.terminalConnections(controlPin)>0:false;
        const control=this.getPinVoltage(id,'5')-gnd;
        const highTrip=controlConnected&&control>.1?clamp(control,.2,vcc):2*vcc/3;
        const lowTrip=highTrip/2;
        if(reset<Math.max(.35,.3*vcc))p.userData.state.out=false;
        else if(trigger<lowTrip)p.userData.state.out=true;
        else if(threshold>highTrip)p.userData.state.out=false;
        const outHigh=Math.max(0,vcc-.08);
        pushV(T(id,'3'),T(id,'1'),p.userData.state.out?outHigh:.03,p);
        pushR(T(id,'7'),T(id,'1'),p.userData.state.out?5e8:12,p);
        if(!controlConnected){
          pushR(T(id,'8'),T(id,'5'),5000,p);
          pushR(T(id,'5'),T(id,'1'),10000,p);
        }
      }
    }
    return N;
  }
}
