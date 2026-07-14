import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { AuthService } from "../../core/services/auth.service";

interface SportIcon {
  emoji: string;
  angle: number; // in degrees
  distance: number; // starting distance in pixels
  color: string;
}

@Component({
  selector: "app-splash",
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen [scrollY]="false">
      <div class="splash-container" [class.phase-4]="phase >= 4">
        
        <!-- Grid/court lines overlay -->
        <div class="court-lines"></div>

        <!-- Stage 1 & 2: Swirling Sports Icons -->
        <div class="icons-container" *ngIf="phase < 3" [class.swirling]="phase === 2">
          <div 
            *ngFor="let icon of sportsIcons; let i = index" 
            class="sport-icon-wrapper"
            [ngClass]="'icon-' + i"
            [style.color]="icon.color"
          >
            <span class="emoji-text">{{ icon.emoji }}</span>
          </div>
        </div>

        <!-- Stage 3 & 4: Braided Y and TYNG Logo -->
        <div class="logo-container" *ngIf="phase >= 3" [class.pulse-active]="phase >= 5">
          <div class="wordmark-wrapper">
            <!-- T -->
            <span class="letter letter-t" [class.visible]="phase >= 4">T</span>

            <!-- Braided Rope Y (SVG) -->
            <div class="logo-y-wrapper">
              <svg viewBox="0 0 100 128" class="rope-y-svg">
                <!-- Left branch: Green strand -->
                <path d="M 12 8 C 22 22, 28 28, 35 40 C 40 48, 47 58, 50 66" 
                      stroke="#8CF000" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-left-green" />
                <!-- Left branch: Orange strand -->
                <path d="M 16 12 C 24 24, 30 30, 37 42 C 42 50, 48 58, 50 66" 
                      stroke="#FF7A00" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-left-orange" />

                <!-- Right branch: Green strand -->
                <path d="M 88 8 C 78 22, 72 28, 65 40 C 60 48, 53 58, 50 66" 
                      stroke="#8CF000" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-right-green" />
                <!-- Right branch: Orange strand -->
                <path d="M 84 12 C 76 24, 70 30, 63 42 C 58 50, 52 58, 50 66" 
                      stroke="#FF7A00" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-right-orange" />

                <!-- Stem: Green strand (Twisted) -->
                <path d="M 50 66 C 46 76, 54 86, 50 96 C 46 106, 54 116, 50 124" 
                      stroke="#8CF000" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-stem-green" />
                <!-- Stem: Orange strand (Twisted) -->
                <path d="M 50 66 C 54 76, 46 86, 54 96 C 46 106, 54 116, 50 124" 
                      stroke="#FF7A00" stroke-width="9" fill="none" stroke-linecap="round"
                      class="rope-strand path-stem-orange" />
              </svg>
            </div>

            <!-- N -->
            <span class="letter letter-n" [class.visible]="phase >= 4">N</span>

            <!-- G -->
            <span class="letter letter-g" [class.visible]="phase >= 4">G</span>
          </div>
        </div>

        <!-- Stage 5: Tagline -->
        <div class="tagline-container" *ngIf="phase >= 5">
          <p class="tagline">
            <span class="tag-play">PLAY</span> TOGETHER. <span class="tag-stay">STAY</span> CONNECTED.
          </p>
        </div>

        <!-- Bottom curve background vector -->
        <div class="bottom-curve">
          <svg viewBox="0 0 1440 200" fill="none" preserveAspectRatio="none">
            <path d="M0 80 C 360 160, 720 40, 1080 120 C 1260 160, 1380 140, 1440 120 L 1440 200 L 0 200 Z" fill="#8CF000" />
          </svg>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
    }

    .splash-container {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: background-color 0.4s ease;
    }

    .splash-container.phase-4 {
      background: #FAFBFC;
    }

    /* Court grid overlay */
    .court-lines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.035;
      background-image: 
        linear-gradient(rgba(17, 24, 39, 0.4) 1px, transparent 1px), 
        linear-gradient(90deg, rgba(17, 24, 39, 0.4) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    /* Bottom green wave curve */
    .bottom-curve {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 90px;
      pointer-events: none;
      z-index: 10;
      opacity: 0.95;
      transform: translateY(0);
      animation: wave-slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes wave-slide-up {
      0% { transform: translateY(100px); }
      100% { transform: translateY(0); }
    }

    /* Stage 1 & 2: Icons container */
    .icons-container {
      position: relative;
      width: 320px;
      height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }

    .sport-icon-wrapper {
      position: absolute;
      font-size: 42px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
      animation: fly-in-center 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .emoji-text {
      font-size: 42px;
      display: inline-block;
    }

    /* Stage 2: Swirling rotation keyframes */
    .icons-container.swirling {
      animation: swirl-spiral 0.85s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes swirl-spiral {
      0% {
        transform: rotate(0deg) scale(1);
        opacity: 1;
      }
      100% {
        transform: rotate(720deg) scale(0.02);
        opacity: 0;
        filter: blur(12px);
      }
    }

    /* Custom flying animation for icons based on index */
    /* 12 icons flying in from outer circular points */
    .icon-0  { --fx: -260px; --fy: -180px; animation-delay: 0.00s; }
    .icon-1  { --fx: 0px;    --fy: -280px; animation-delay: 0.04s; }
    .icon-2  { --fx: 260px;  --fy: -180px; animation-delay: 0.08s; }
    .icon-3  { --fx: 280px;  --fy: 0px;    animation-delay: 0.12s; }
    .icon-4  { --fx: 260px;  --fy: 180px;  animation-delay: 0.16s; }
    .icon-5  { --fx: 0px;    --fy: 280px;  animation-delay: 0.20s; }
    .icon-6  { --fx: -260px; --fy: 180px;  animation-delay: 0.24s; }
    .icon-7  { --fx: -280px; --fy: 0px;    animation-delay: 0.28s; }
    .icon-8  { --fx: -150px; --fy: -250px; animation-delay: 0.32s; }
    .icon-9  { --fx: 150px;  --fy: -250px; animation-delay: 0.36s; }
    .icon-10 { --fx: 150px;  --fy: 250px;  animation-delay: 0.40s; }
    .icon-11 { --fx: -150px; --fy: 250px;  animation-delay: 0.44s; }

    @keyframes fly-in-center {
      0% {
        transform: translate(var(--fx), var(--fy)) scale(0.3) rotate(45deg);
        opacity: 0;
        filter: blur(4px);
      }
      80% {
        transform: translate(0, 0) scale(1.1) rotate(-5deg);
        opacity: 1;
        filter: blur(0);
      }
      100% {
        /* Final stage 1 landing points before swirl starts */
        transform: translate(0, 0) scale(1.05) rotate(0deg);
        opacity: 1;
      }
    }

    /* Stage 3 & 4: TYNG Logo */
    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }

    .wordmark-wrapper {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
    }

    .letter {
      font-size: 80px;
      font-weight: 900;
      color: #111111;
      line-height: 1;
      letter-spacing: -0.05em;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .letter.visible {
      opacity: 1;
      transform: scale(1);
    }

    .letter-t { transition-delay: 0.05s; }
    .letter-n { transition-delay: 0.15s; }
    .letter-g { transition-delay: 0.25s; }

    /* Custom sizing for the Y in TYNG logo */
    .logo-y-wrapper {
      width: 72px;
      height: 92px;
      position: relative;
      margin: 0 4px;
      align-self: center;
      transform: translateY(6px);
    }

    .rope-y-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* Stage 3: SVG rope strand drawing */
    .rope-strand {
      stroke-dasharray: 180;
      stroke-dashoffset: 180;
      animation: draw-rope 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    /* Delay the rope drawing */
    .path-left-green   { animation-delay: 0.0s; }
    .path-left-orange  { animation-delay: 0.05s; }
    .path-right-green  { animation-delay: 0.1s; }
    .path-right-orange { animation-delay: 0.15s; }
    .path-stem-green   { animation-delay: 0.2s; }
    .path-stem-orange  { animation-delay: 0.25s; }

    @keyframes draw-rope {
      0% {
        stroke-dashoffset: 180;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }

    /* Stage 5: Tagline Slide Up */
    .tagline-container {
      margin-top: 24px;
      z-index: 5;
      text-align: center;
      animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .tagline {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #6B7280;
      text-transform: uppercase;
      margin: 0;
    }

    .tag-play {
      color: #8CF000;
    }

    .tag-stay {
      color: #FF7A00;
    }

    @keyframes slide-up-fade {
      0% {
        opacity: 0;
        transform: translateY(15px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Logo Gentle Heartbeat Pulse in hold state */
    .logo-container.pulse-active {
      animation: gentle-heartbeat 2s infinite ease-in-out;
    }

    @keyframes gentle-heartbeat {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.03);
        filter: drop-shadow(0 0 10px rgba(140, 240, 0, 0.15));
      }
    }
  `]
})
export class SplashPage implements OnInit, OnDestroy {
  phase = 0;
  private timerIds: any[] = [];

  readonly sportsIcons: SportIcon[] = [
    { emoji: "⚽", angle: 0, distance: 300, color: "#111827" },
    { emoji: "🏀", angle: 30, distance: 300, color: "#FF7A00" },
    { emoji: "🏏", angle: 60, distance: 300, color: "#111827" },
    { emoji: "🏸", angle: 90, distance: 300, color: "#38BDF8" },
    { emoji: "🎾", angle: 120, distance: 300, color: "#8CF000" },
    { emoji: "🏐", angle: 150, distance: 300, color: "#FF7A00" },
    { emoji: "🏓", angle: 180, distance: 300, color: "#38BDF8" },
    { emoji: "⛳", angle: 210, distance: 300, color: "#8CF000" },
    { emoji: "🏑", angle: 240, distance: 300, color: "#111827" },
    { emoji: "🏋️", angle: 270, distance: 300, color: "#111827" },
    { emoji: "🏃", angle: 300, distance: 300, color: "#FF7A00" },
    { emoji: "🏊", angle: 330, distance: 300, color: "#38BDF8" }
  ];

  constructor(
    private router: Router,
    private zone: NgZone,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Show splash animation (skip for repeat visits in the same session)
    const seen = sessionStorage.getItem("tyng_splash_completed");
    if (seen) {
      this.routeToNext();
      return;
    }
    sessionStorage.setItem("tyng_splash_completed", "true");

    this.runAnimationTimeline();
  }

  ngOnDestroy() {
    this.timerIds.forEach(clearTimeout);
  }

  private runAnimationTimeline() {
    // 0:00 - 0:00.6 : Fly in phase (phase 0)
    // 0:00.6 - 0:01.4 : Swirl and spiral phase (phase 2)
    this.timerIds.push(
      setTimeout(() => {
        this.zone.run(() => { this.phase = 2; });
      }, 650)
    );

    // 0:01.4 - 0:02.2 : Braided rope Y drawing phase (phase 3)
    this.timerIds.push(
      setTimeout(() => {
        this.zone.run(() => { this.phase = 3; });
      }, 1450)
    );

    // 0:02.2 - 0:02.6 : T N G letters pop-in phase (phase 4)
    this.timerIds.push(
      setTimeout(() => {
        this.zone.run(() => { this.phase = 4; });
      }, 2250)
    );

    // 0:02.6 - 0:03.0 : Tagline slides up + Gentle pulse starts (phase 5)
    this.timerIds.push(
      setTimeout(() => {
        this.zone.run(() => { this.phase = 5; });
      }, 2650)
    );

    // Final hold state: 1.8 seconds after tagline, navigate forward
    this.timerIds.push(
      setTimeout(() => {
        this.zone.run(() => { this.routeToNext(); });
      }, 4500)
    );
  }

  private routeToNext() {
    const user = this.auth.user();
    if (user) {
      if (user.isOnboarded) {
        const path = user.role === 'coach'
          ? '/app/coach/dashboard'
          : user.role === 'venue'
            ? '/app/venue/dashboard'
            : '/app/home';
        void this.router.navigateByUrl(path, { replaceUrl: true });
      } else {
        const path = user.role === 'coach'
          ? '/coach-onboarding'
          : user.role === 'venue'
            ? '/venue-onboarding'
            : '/onboarding';
        void this.router.navigateByUrl(path, { replaceUrl: true });
      }
    } else {
      void this.router.navigateByUrl("/welcome", { replaceUrl: true });
    }
  }
}
