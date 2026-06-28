import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-splash",
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen [scrollY]="false">
      <div class="splash-wrapper">
        <canvas #splashCanvas class="splash-canvas"></canvas>
        <div class="logo-overlay" [class.logo-visible]="logoVisible">
          <div class="logo-glow-ring"></div>
          <div class="logo-glow-ring ring2"></div>
          <img src="assets/tyng-logo.jpeg" alt="TYNG" class="splash-logo" [class.logo-pulse]="logoPulse" />
          <p class="tagline" [class.tagline-visible]="taglineVisible">Every Sport. One Platform.</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }
    .splash-wrapper { position:relative; width:100%; height:100vh; overflow:hidden; background:#0B1220; }
    .splash-canvas  { position:absolute; inset:0; width:100%; height:100%; }
    .logo-overlay {
      position:absolute; inset:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      opacity:0; transform:scale(0.8); pointer-events:none;
      transition: opacity 0.65s cubic-bezier(.34,1.56,.64,1), transform 0.65s cubic-bezier(.34,1.56,.64,1);
    }
    .logo-overlay.logo-visible { opacity:1; transform:scale(1); }
    .logo-glow-ring {
      position:absolute; width:240px; height:240px; border-radius:50%;
      border:1px solid rgba(33,48,212,.45);
      animation: rp 2s ease-in-out infinite; pointer-events:none;
    }
    .ring2 { width:310px; height:310px; border-color:rgba(0,201,119,.25); animation-delay:.7s; }
    .splash-logo {
      width:180px; height:180px; border-radius:28px; object-fit:contain; position:relative; z-index:2;
      box-shadow: 0 0 0 4px rgba(33,48,212,.2), 0 0 60px rgba(33,48,212,.6), 0 0 120px rgba(33,48,212,.3), 0 20px 60px rgba(0,0,0,.7);
    }
    .splash-logo.logo-pulse { animation: lp 1.8s ease-in-out infinite; }
    .tagline {
      margin-top:28px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      font-size:16px; font-weight:300; letter-spacing:3.5px; text-transform:uppercase;
      color:rgba(255,255,255,0); position:relative; z-index:2;
      transition: color .9s ease .4s;
    }
    .tagline.tagline-visible { color:rgba(255,255,255,.78); }
    @keyframes rp { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.09);opacity:.25} }
    @keyframes lp {
      0%,100%{box-shadow:0 0 0 4px rgba(33,48,212,.2),0 0 60px rgba(33,48,212,.6),0 0 120px rgba(33,48,212,.3),0 20px 60px rgba(0,0,0,.7)}
      50%{box-shadow:0 0 0 7px rgba(33,48,212,.35),0 0 95px rgba(33,48,212,.85),0 0 170px rgba(33,48,212,.45),0 20px 60px rgba(0,0,0,.7)}
    }
  `]
})
export class SplashPage implements AfterViewInit, OnDestroy {
  @ViewChild("splashCanvas") canvasRef!: ElementRef<HTMLCanvasElement>;
  logoVisible = false;
  logoPulse   = false;
  taglineVisible = false;

  private ctx!: CanvasRenderingContext2D;
  private W=0; private H=0;
  private raf=0; private startTime=0;
  private particles: any[] = [];
  private vortexStarted = false;
  private vcx=0; private vcy=0;

  constructor(private router: Router, private zone: NgZone, private auth: AuthService) {}

  ngAfterViewInit() {
    const cv = this.canvasRef.nativeElement;
    this.ctx = cv.getContext("2d")!;
    this.W = cv.width  = cv.offsetWidth  * devicePixelRatio;
    this.H = cv.height = cv.offsetHeight * devicePixelRatio;
    this.vcx = this.W/2; this.vcy = this.H/2;
    this.startTime = performance.now();
    this.zone.runOutsideAngular(() => this.loop(performance.now()));
  }
  ngOnDestroy() { cancelAnimationFrame(this.raf); }

  private clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
  private prog(t:number,s:number,e:number){return this.clamp((t-s)/(e-s),0,1);}
  private easOut(t:number){return 1-Math.pow(1-t,3);}
  private alpha(p:number,fi=0.18,fo=0.78){
    if(p<fi)return p/fi; if(p>fo)return 1-(p-fo)/(1-fo); return 1;
  }

  private loop(now:number) {
    this.raf = requestAnimationFrame(n=>this.loop(n));
    const t=((now-this.startTime)/1000)*2.6;
    const c=this.ctx; const W=this.W; const H=this.H;
    c.clearRect(0,0,W,H);
    this.bg(t,W,H);
    this.centerGlow(t,W/2,H/2);
    if(t>=0.4&&t<=1.7) this.cricket(t,W/2,H/2);
    if(t>=1.5&&t<=2.7) this.football(t,W/2,H/2);
    if(t>=2.4&&t<=3.6) this.badminton(t,W/2,H/2);
    if(t>=3.2&&t<=4.4) this.tennis(t,W/2,H/2);
    if(t>=4.0&&t<=5.2) this.golf(t,W/2,H/2);
    if(t>=4.7)         this.vortex(t);
    this.drawParts();
    if(t>=5.4&&!this.logoVisible) {
      this.zone.run(()=>{ this.logoVisible=true; });
      setTimeout(()=>this.zone.run(()=>{ this.logoPulse=true; }),200);
      setTimeout(()=>this.zone.run(()=>{ this.taglineVisible=true; }),400);
    }
    if(t>=7.8){
      cancelAnimationFrame(this.raf);
      this.zone.run(()=>{
        const user = this.auth.user();
        if (user) {
          if (user.isOnboarded) {
            void this.router.navigateByUrl("/app/home", { replaceUrl: true });
          } else {
            void this.router.navigateByUrl("/onboarding", { replaceUrl: true });
          }
        } else {
          void this.router.navigateByUrl("/welcome", { replaceUrl: true });
        }
      });
    }
  }

  private bg(t:number,W:number,H:number){
    const c=this.ctx;
    const i=Math.min(t/2,1)*0.2;
    const g=c.createRadialGradient(W/2,H/2,0,W/2,H/2,H*.72);
    g.addColorStop(0,`rgba(33,48,212,${i})`);
    g.addColorStop(0.5,"rgba(11,18,32,.97)");
    g.addColorStop(1,"rgba(4,7,18,1)");
    c.fillStyle=g; c.fillRect(0,0,W,H);
  }

  private centerGlow(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const p=this.clamp(t/.8,0,1);
    const g=c.createRadialGradient(cx,cy,0,cx,cy,180*this.easOut(p)*s);
    g.addColorStop(0,`rgba(79,107,255,${.22*p})`);
    g.addColorStop(.5,`rgba(33,48,212,${.1*p})`);
    g.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=g; c.fillRect(0,0,this.W,this.H);
  }

  private glowCircle(cx:number,cy:number,r:number,col:string,glow:number,a:number){
    const c=this.ctx; c.save(); c.globalAlpha=a;
    const g=c.createRadialGradient(cx-r*.3,cy-r*.3,0,cx,cy,r);
    g.addColorStop(0,"rgba(255,255,255,.88)");
    g.addColorStop(.3,col);
    g.addColorStop(1,col.replace("rgb(","rgba(").replace(")",",0.3)"));
    c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fillStyle=g; c.fill();
    const h=c.createRadialGradient(cx,cy,r*.8,cx,cy,r+glow);
    h.addColorStop(0,col.replace("rgb(","rgba(").replace(")",",0.38)")); h.addColorStop(1,"rgba(0,0,0,0)");
    c.beginPath(); c.arc(cx,cy,r+glow,0,Math.PI*2); c.fillStyle=h; c.fill();
    c.restore();
  }

  private rr(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.arcTo(x+w,y,x+w,y+r,r);
    c.lineTo(x+w,y+h-r); c.arcTo(x+w,y+h,x+w-r,y+h,r);
    c.lineTo(x+r,y+h); c.arcTo(x,y+h,x,y+h-r,r);
    c.lineTo(x,y+r); c.arcTo(x,y,x+r,y,r); c.closePath();
  }

  private spawn(cx:number,cy:number,col:string,n=16){
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, sp=1.2+Math.random()*3.2;
      this.particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:.011+Math.random()*.013,r:1.5+Math.random()*5,col,vortex:false});
    }
  }

  private vortex(t:number){
    if(!this.vortexStarted){
      this.vortexStarted=true;
      const cols=["rgba(79,107,255,","rgba(33,48,212,","rgba(0,201,119,","rgba(255,92,53,","rgba(255,255,255,"];
      for(let i=0;i<240;i++){
        const a=Math.random()*Math.PI*2, d=60+Math.random()*280, sc=this.W/400;
        const x=this.W/2+Math.cos(a)*d*sc, y=this.H/2+Math.sin(a)*d*sc;
        const col=cols[Math.floor(Math.random()*cols.length)]+(0.55+Math.random()*.45)+")";
        this.particles.push({x,y,vx:0,vy:0,life:1,decay:.005,r:1.5+Math.random()*4.5,col,vortex:true});
      }
    }
    for(const p of this.particles){
      if(p.vortex){
        const dx=this.vcx-p.x, dy=this.vcy-p.y, dist=Math.sqrt(dx*dx+dy*dy)+.1;
        const pull=3+110/dist, tang=2.2;
        p.vx+=(dx/dist)*pull*.045+(-dy/dist)*tang*.045;
        p.vy+=(dy/dist)*pull*.045+(dx/dist)*tang*.045;
        p.vx*=.87; p.vy*=.87;
      } else { p.vy+=.04; p.vx*=.97; p.vy*=.97; }
      p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
    }
    this.particles=this.particles.filter(p=>p.life>0);
  }

  private drawParts(){
    const c=this.ctx; c.save();
    for(const p of this.particles){
      c.globalAlpha=p.life*.82; c.fillStyle=p.col;
      c.shadowColor=p.col; c.shadowBlur=p.r*3;
      c.beginPath(); c.arc(p.x,p.y,p.r*p.life,0,Math.PI*2); c.fill();
    }
    c.shadowBlur=0; c.restore();
  }

  /* CRICKET */
  private cricket(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const l=(t-0.4)/1.3; const a=this.alpha(l);
    const ey=this.easOut(this.clamp(l/.3,0,1));
    const bx=cx-40*s+(1-ey)*(-200*s);
    const by=cy+Math.sin(l*Math.PI*3)*10*s;
    c.save(); c.globalAlpha=a; c.translate(bx,by); c.rotate(-0.4+l*.28);
    c.shadowColor="rgba(255,210,80,.65)"; c.shadowBlur=22*s;
    const bg=c.createLinearGradient(-8*s,-65*s,8*s,65*s);
    bg.addColorStop(0,"#d4a855"); bg.addColorStop(.5,"#f0c878"); bg.addColorStop(1,"#8b6914");
    c.fillStyle=bg; this.rr(c,-8*s,-72*s,16*s,102*s,4*s); c.fill();
    c.fillStyle="#5c3d1e"; this.rr(c,-4*s,30*s,8*s,42*s,3*s); c.fill();
    c.strokeStyle="rgba(255,255,255,.3)"; c.lineWidth=1.4*s;
    for(let i=0;i<5;i++){c.beginPath();c.moveTo(-4*s,(32+i*6)*s);c.lineTo(4*s,(32+i*6)*s);c.stroke();}
    c.restore();
    const oa=l*Math.PI*4-Math.PI/2;
    const ox=bx+Math.cos(oa)*52*s, oy=by+Math.sin(oa)*22*s;
    this.glowCircle(ox,oy,13*s,"rgb(180,28,28)",18*s,a);
    c.save(); c.globalAlpha=a*.75; c.strokeStyle="rgba(255,255,255,.7)"; c.lineWidth=1.4*s;
    c.beginPath(); c.arc(ox,oy,9*s,.2,Math.PI-.2); c.stroke();
    c.beginPath(); c.arc(ox,oy,9*s,Math.PI+.2,Math.PI*2-.2); c.stroke();
    c.restore();
    if(l>.7){this.spawn(bx,by,"rgba(255,195,45,.85)",4);this.spawn(ox,oy,"rgba(200,45,45,.85)",4);}
  }

  /* FOOTBALL */
  private football(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const l=(t-1.5)/1.2; const a=this.alpha(l);
    const ey=this.easOut(this.clamp(l/.3,0,1));
    const fy=l>.5?-(l-.5)*130*s:0;
    const bx=cx+Math.sin(l*Math.PI)*18*s;
    const by=cy+(1-ey)*200*s+fy;
    const r=46*s; const sp=l*Math.PI*6;
    c.save(); c.globalAlpha=a; c.translate(bx,by); c.rotate(sp);
    const bg=c.createRadialGradient(-r*.3,-r*.3,0,0,0,r);
    bg.addColorStop(0,"#fff"); bg.addColorStop(.15,"#e6e6e6"); bg.addColorStop(.6,"#bbb"); bg.addColorStop(1,"#444");
    c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.fillStyle=bg; c.fill();
    c.shadowColor="rgba(255,255,255,.35)"; c.shadowBlur=22*s;
    c.fillStyle="rgba(18,18,18,.88)";
    const pp=[[0,0],[0,-r*.5],[r*.47,-r*.14],[r*.28,r*.4],[-r*.28,r*.4],[-r*.47,-r*.14]];
    for(const [px,py] of pp){
      c.beginPath();
      for(let i=0;i<5;i++){const fa=i*Math.PI*2/5-Math.PI/2,pr=15*s;
        i===0?c.moveTo(px+Math.cos(fa)*pr,py+Math.sin(fa)*pr):c.lineTo(px+Math.cos(fa)*pr,py+Math.sin(fa)*pr);}
      c.closePath(); c.fill();
    }
    c.restore();
    c.save(); c.globalAlpha=a*.55;
    const hl=c.createRadialGradient(bx-r*.3,by-r*.35,0,bx-r*.3,by-r*.35,r*.38);
    hl.addColorStop(0,"rgba(255,255,255,.88)"); hl.addColorStop(1,"rgba(255,255,255,0)");
    c.fillStyle=hl; c.beginPath(); c.arc(bx-r*.3,by-r*.35,r*.38,0,Math.PI*2); c.fill(); c.restore();
    if(l>.72){this.spawn(bx,by,"rgba(210,210,210,.85)",4);}
  }

  /* BADMINTON */
  private badminton(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const l=(t-2.4)/1.2; const a=this.alpha(l);
    const en=this.easOut(this.clamp(l/.28,0,1));
    const sep=l>.5?(l-.5)*2.2:0;
    const fa=l*Math.PI*1.1;
    const rx=cx-28*s-(1-en)*175*s+sep*(-58*s);
    const ry=cy+Math.sin(fa)*18*s;
    c.save(); c.globalAlpha=a; c.translate(rx,ry); c.rotate(-.55+l*.38);
    c.shadowColor="rgba(100,200,255,.5)"; c.shadowBlur=18*s;
    c.strokeStyle="rgba(100,200,255,.9)"; c.lineWidth=2.8*s;
    c.beginPath(); c.ellipse(0,-20*s,22*s,28*s,0,0,Math.PI*2); c.stroke();
    c.strokeStyle="rgba(200,240,255,.45)"; c.lineWidth=.75*s;
    for(let i=-18;i<=18;i+=6){c.beginPath();c.moveTo(i*s,-46*s);c.lineTo(i*s,7*s);c.stroke();}
    for(let i=-46;i<=7;i+=7){c.beginPath();c.moveTo(-22*s,i*s);c.lineTo(22*s,i*s);c.stroke();}
    const hg=c.createLinearGradient(-3*s,8*s,3*s,54*s);
    hg.addColorStop(0,"#4a9eff"); hg.addColorStop(1,"#1a3a6e");
    c.fillStyle=hg; this.rr(c,-4*s,8*s,8*s,44*s,3*s); c.fill(); c.restore();
    const shx=cx+52*s+(1-en)*175*s+sep*(58*s);
    const shy=cy-14*s+Math.sin(fa+1)*13*s;
    c.save(); c.globalAlpha=a; c.translate(shx,shy); c.rotate(l*Math.PI*2.8);
    const cg=c.createRadialGradient(0,0,0,0,0,10*s);
    cg.addColorStop(0,"#f5e6c8"); cg.addColorStop(1,"#c8a050");
    c.fillStyle=cg; c.beginPath(); c.arc(0,0,10*s,0,Math.PI*2); c.fill();
    c.strokeStyle="rgba(255,255,255,.8)"; c.lineWidth=.9*s;
    for(let i=0;i<12;i++){const fa2=i*Math.PI*2/12;c.beginPath();c.moveTo(Math.cos(fa2)*10*s,Math.sin(fa2)*10*s);c.lineTo(Math.cos(fa2)*30*s,Math.sin(fa2)*30*s);c.stroke();}
    c.beginPath(); c.arc(0,0,30*s,0,Math.PI*2); c.strokeStyle="rgba(255,255,255,.28)"; c.lineWidth=.9*s; c.stroke();
    c.restore();
    if(l>.75){this.spawn(rx,ry,"rgba(100,200,255,.85)",3);this.spawn(shx,shy,"rgba(255,245,190,.85)",3);}
  }

  /* TENNIS */
  private tennis(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const l=(t-3.2)/1.2; const a=this.alpha(l);
    const en=this.easOut(this.clamp(l/.28,0,1));
    const sp=l*Math.PI*4.5;
    const rx=cx-(1-en)*200*s;
    const ry=cy+Math.sin(l*Math.PI*2)*16*s;
    c.save(); c.globalAlpha=a; c.translate(rx,ry); c.rotate(sp*.12);
    c.shadowColor="rgba(0,220,100,.5)"; c.shadowBlur=20*s;
    c.strokeStyle="rgba(0,220,100,.9)"; c.lineWidth=3.5*s;
    c.beginPath(); c.ellipse(0,-15*s,30*s,38*s,0,0,Math.PI*2); c.stroke();
    c.strokeStyle="rgba(180,255,180,.45)"; c.lineWidth=.65*s;
    for(let i=-24;i<=24;i+=7){c.beginPath();c.moveTo(i*s,-50*s);c.lineTo(i*s,8*s);c.stroke();}
    for(let i=-50;i<=8;i+=8){c.beginPath();c.moveTo(-30*s,i*s);c.lineTo(30*s,i*s);c.stroke();}
    const hg=c.createLinearGradient(0,26*s,0,68*s);
    hg.addColorStop(0,"#00dc64"); hg.addColorStop(1,"#004f22");
    c.fillStyle=hg; this.rr(c,-5*s,26*s,10*s,42*s,4*s); c.fill(); c.restore();
    const ba=l*Math.PI*4;
    const bx=rx+Math.cos(ba)*68*s, by=ry+Math.sin(ba)*24*s;
    c.save(); c.globalAlpha=a; c.translate(bx,by); c.rotate(sp);
    const tg=c.createRadialGradient(-5*s,-5*s,0,0,0,18*s);
    tg.addColorStop(0,"#e8ff50"); tg.addColorStop(1,"#8a9e00");
    c.fillStyle=tg; c.beginPath(); c.arc(0,0,18*s,0,Math.PI*2); c.fill();
    c.strokeStyle="rgba(255,255,255,.6)"; c.lineWidth=1.4*s;
    c.beginPath(); c.moveTo(-14*s,8*s); c.bezierCurveTo(-5*s,-12*s,5*s,-12*s,14*s,8*s); c.stroke();
    c.restore();
    if(l>.74){this.spawn(rx,ry,"rgba(0,220,100,.85)",3);this.spawn(bx,by,"rgba(200,255,50,.85)",3);}
  }

  /* GOLF */
  private golf(t:number,cx:number,cy:number){
    const c=this.ctx; const s=this.W/400;
    const l=(t-4.0)/1.2; const a=this.alpha(l);
    const en=this.easOut(this.clamp(l/.3,0,1));
    const lev=l>.35?this.easOut((l-.35)/.45)*(-85*s):0;
    const sp=l*Math.PI*1.8;
    const clx=cx+(1-en)*200*s;
    const cly=cy+18*s;
    c.save(); c.globalAlpha=a; c.translate(clx,cly); c.rotate(-.28+sp*.08);
    c.shadowColor="rgba(200,185,100,.5)"; c.shadowBlur=16*s;
    const sg=c.createLinearGradient(-2*s,-100*s,2*s,42*s);
    sg.addColorStop(0,"#c8c8c8"); sg.addColorStop(1,"#585858");
    c.fillStyle=sg; this.rr(c,-2.5*s,-100*s,5*s,130*s,2*s); c.fill();
    const hg=c.createLinearGradient(-20*s,30*s,20*s,50*s);
    hg.addColorStop(0,"#e2e2e2"); hg.addColorStop(1,"#888");
    c.fillStyle=hg; this.rr(c,-18*s,30*s,36*s,18*s,5*s); c.fill(); c.restore();
    const bx=l<.35?cx+200*s*(1-en):cx;
    const by=cly+42*s+lev;
    this.glowCircle(bx,by,15*s,"rgb(238,238,238)",14*s,a);
    c.save(); c.globalAlpha=a*.38; c.fillStyle="rgba(155,155,155,.6)";
    for(let i=0;i<8;i++){const da=i*Math.PI/4;c.beginPath();c.arc(bx+Math.cos(da)*8*s,by+Math.sin(da)*8*s,2*s,0,Math.PI*2);c.fill();}
    c.restore();
    if(l>.74){this.spawn(clx,cly,"rgba(200,185,100,.85)",4);this.spawn(bx,by,"rgba(240,240,255,.85)",4);}
  }
}
