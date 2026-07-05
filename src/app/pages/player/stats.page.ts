import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="stats-page">

        <!-- Header -->
        <div class="stats-header">
          <button class="back-btn" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="stats-title">Personal Stats</h1>
          <button class="edit-btn" (click)="editing = !editing" [style.background]="editing ? '#8CF000' : '#F3F4F6'">
            <ion-icon [name]="editing ? 'checkmark-outline' : 'pencil-outline'"></ion-icon>
          </button>
        </div>

        <!-- Profile Hero -->
        <div class="profile-hero">
          <div class="avatar-wrap">
            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&auto=format" alt="Arjun" class="avatar-img" />
            <div class="avatar-level">28</div>
            <button *ngIf="editing" class="camera-btn">
              <ion-icon name="camera-outline"></ion-icon>
            </button>
          </div>

          <div class="profile-name">Arjun Sharma</div>
          <div class="profile-sub">@arjun_cricket · Lucknow</div>

          <!-- TP + Level row -->
          <div class="tp-card">
            <div class="tp-left">
              <div class="tp-label">TOP 5%</div>
              <div class="tp-number">1,250</div>
              <div class="tp-sub">TP Points</div>
            </div>
            <div class="tp-right">
              <div class="tp-lvl-label">Level</div>
              <div class="tp-lvl">28</div>
            </div>
            <div class="tp-orb"></div>
          </div>

          <!-- XP Progress -->
          <div class="xp-row">
            <span class="xp-num">1,850 / 2,500 XP</span>
            <span class="xp-pct">74%</span>
          </div>
          <div class="xp-bar">
            <div class="xp-fill" style="width: 74%;"></div>
          </div>
          <div class="xp-to-next">650 XP to Level 29</div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid-wrap">
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">156</div>
              <div class="stat-lbl">Games Played</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">72%</div>
              <div class="stat-lbl">Win Rate</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">98%</div>
              <div class="stat-lbl">Reliability</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">4.8 ⭐</div>
              <div class="stat-lbl">Rating</div>
            </div>
          </div>
        </div>

        <div class="cards-wrap">

          <!-- Physical Stats -->
          <div class="s-card">
            <div class="s-card-header">
              <span>💪</span>
              <span class="s-card-title">Physical Stats</span>
            </div>
            <div class="s-card-body">
              <div class="field-row">
                <span class="field-label">Height (cm)</span>
                <input *ngIf="editing" [(ngModel)]="stats.height" type="number" class="field-input" />
                <span *ngIf="!editing" class="field-val">{{ stats.height }} cm</span>
              </div>
              <div class="field-row">
                <span class="field-label">Weight (kg)</span>
                <input *ngIf="editing" [(ngModel)]="stats.weight" type="number" class="field-input" />
                <span *ngIf="!editing" class="field-val">{{ stats.weight }} kg</span>
              </div>
              <div class="field-row">
                <span class="field-label">BMI</span>
                <span class="field-val bmi-badge">{{ getBmi() }}</span>
              </div>
              <div class="field-row">
                <span class="field-label">Blood Group</span>
                <div class="chips-wrap">
                  <button *ngFor="let b of bloodGroups" class="chip"
                    [class.chip-active]="stats.bloodGroup === b"
                    (click)="editing && (stats.bloodGroup = b)">{{ b }}</button>
                </div>
              </div>
              <div class="field-row">
                <span class="field-label">Gender</span>
                <div class="chips-wrap">
                  <button *ngFor="let g of genders" class="chip"
                    [class.chip-active]="stats.gender === g"
                    (click)="editing && (stats.gender = g)">{{ g }}</button>
                </div>
              </div>
              <div class="field-row">
                <span class="field-label">Dominant Hand</span>
                <div class="chips-wrap">
                  <button *ngFor="let h of hands" class="chip"
                    [class.chip-active]="stats.dominantHand === h"
                    (click)="editing && (stats.dominantHand = h)">{{ h }}</button>
                </div>
              </div>
              <div class="field-row">
                <span class="field-label">Dominant Foot</span>
                <div class="chips-wrap">
                  <button *ngFor="let f of feet" class="chip"
                    [class.chip-active]="stats.dominantFoot === f"
                    (click)="editing && (stats.dominantFoot = f)">{{ f }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sports Profile -->
          <div class="s-card">
            <div class="s-card-header">
              <span>🏆</span>
              <span class="s-card-title">Sports Profile</span>
            </div>
            <div class="s-card-body">
              <div class="field-row">
                <span class="field-label">Primary Sports</span>
                <div class="chips-wrap">
                  <button *ngFor="let s of allSports" class="chip"
                    [class.chip-active]="stats.sports.includes(s)"
                    (click)="editing && toggleSport(s)">{{ s }}</button>
                </div>
              </div>
              <div class="field-row">
                <span class="field-label">Fitness Level</span>
                <div class="chips-wrap">
                  <button *ngFor="let fl of fitnessLevels" class="chip"
                    [class.chip-active]="stats.fitnessLevel === fl"
                    (click)="editing && (stats.fitnessLevel = fl)">{{ fl }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Skills -->
          <div class="s-card">
            <div class="s-card-header">
              <span>📊</span>
              <span class="s-card-title">Skills Performance</span>
            </div>
            <div class="s-card-body">
              <div *ngFor="let skill of skills" class="skill-row">
                <div class="skill-header">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-pct" [style.color]="'#8CF000'">{{ skill.value }}%</span>
                </div>
                <div class="skill-bar">
                  <div class="skill-fill" [style.width]="skill.value + '%'" [style.background]="skill.color"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Health & Wellness -->
          <div class="s-card">
            <div class="s-card-header">
              <span>🏥</span>
              <span class="s-card-title">Health & Wellness</span>
            </div>
            <div class="s-card-body">
              <div class="field-row">
                <span class="field-label">Diet Preference</span>
                <div class="chips-wrap">
                  <button *ngFor="let d of diets" class="chip"
                    [class.chip-active]="stats.diet === d"
                    (click)="editing && (stats.diet = d)">{{ d }}</button>
                </div>
              </div>
              <div class="field-row">
                <div class="toggle-row">
                  <span class="field-label">Any Injuries?</span>
                  <button class="toggle-btn" [class.toggle-on]="stats.hasInjuries" (click)="editing && (stats.hasInjuries = !stats.hasInjuries)">
                    <div class="toggle-thumb" [class.toggle-thumb-on]="stats.hasInjuries"></div>
                  </button>
                </div>
                <textarea *ngIf="stats.hasInjuries && editing" [(ngModel)]="stats.injuryDesc" class="textarea-input" rows="2" placeholder="Describe injuries..."></textarea>
                <span *ngIf="stats.hasInjuries && !editing" class="field-val">{{ stats.injuryDesc }}</span>
              </div>
              <div class="field-row">
                <div class="toggle-row">
                  <span class="field-label">Any Allergies?</span>
                  <button class="toggle-btn" [class.toggle-on]="stats.hasAllergies" (click)="editing && (stats.hasAllergies = !stats.hasAllergies)">
                    <div class="toggle-thumb" [class.toggle-thumb-on]="stats.hasAllergies"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy -->
          <div class="s-card">
            <div class="s-card-header">
              <span>🔒</span>
              <span class="s-card-title">Privacy</span>
            </div>
            <div class="s-card-body">
              <p class="privacy-desc">Control who can see your personal health data.</p>
              <div class="privacy-opts">
                <button *ngFor="let p of privacyOpts" class="privacy-btn"
                  [class.privacy-btn-active]="stats.privacy === p.id"
                  (click)="editing && (stats.privacy = p.id)">
                  <span>{{ p.icon }}</span>
                  <span>{{ p.label }}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        <div style="height:120px;"></div>
      </div>
    </ion-content>
  `,
  styles: [`
    .stats-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .stats-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 52px 20px 16px;
      background: #FFFFFF;
    }

    .back-btn, .edit-btn {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; cursor: pointer;
      transition: background 0.2s;
    }

    .stats-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }

    /* Profile Hero */
    .profile-hero {
      background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
      padding: 24px 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .avatar-wrap {
      position: relative;
      margin-bottom: 14px;
    }

    .avatar-img {
      width: 88px; height: 88px;
      border-radius: 50%;
      border: 3px solid white;
      object-fit: cover;
    }

    .avatar-level {
      position: absolute;
      bottom: -4px; right: -4px;
      width: 30px; height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8CF000, #A3E635);
      border: 2px solid #1F2937;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      font-weight: 900;
      color: #111827;
    }

    .camera-btn {
      position: absolute;
      top: 0; right: -4px;
      width: 26px; height: 26px;
      border-radius: 50%;
      background: #FF7A00;
      border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: white; cursor: pointer;
    }

    .profile-name {
      font-size: 20px;
      font-weight: 800;
      color: white;
      margin-bottom: 2px;
    }

    .profile-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      margin-bottom: 16px;
    }

    /* TP Card */
    .tp-card {
      width: 100%;
      background: rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .tp-orb {
      position: absolute;
      top: -24px; right: -24px;
      width: 96px; height: 96px;
      border-radius: 50%;
      background: rgba(140,240,0,0.1);
    }

    .tp-label {
      font-size: 10px;
      font-weight: 800;
      color: #8CF000;
      letter-spacing: 0.1em;
      margin-bottom: 2px;
    }

    .tp-number {
      font-size: 28px;
      font-weight: 900;
      color: white;
      line-height: 1;
    }

    .tp-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      margin-top: 2px;
    }

    .tp-lvl-label {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      text-align: right;
    }

    .tp-lvl {
      font-size: 40px;
      font-weight: 900;
      color: #8CF000;
      line-height: 1;
    }

    /* XP */
    .xp-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .xp-num { font-size: 11px; color: rgba(255,255,255,0.4); }
    .xp-pct { font-size: 11px; font-weight: 800; color: #8CF000; }

    .xp-bar {
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .xp-fill {
      height: 100%;
      background: linear-gradient(90deg, #8CF000, #FF7A00);
      border-radius: 999px;
    }

    .xp-to-next {
      font-size: 10px;
      color: rgba(255,255,255,0.3);
    }

    /* Stats grid */
    .stats-grid-wrap {
      padding: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .stat-box {
      background: #FFFFFF;
      border-radius: 18px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 1px 10px rgba(0,0,0,0.06);
    }

    .stat-num {
      font-size: 22px;
      font-weight: 900;
      color: #111827;
      margin-bottom: 4px;
    }

    .stat-lbl {
      font-size: 11px;
      color: #9CA3AF;
      font-weight: 600;
    }

    /* Cards */
    .cards-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 16px;
    }

    .s-card {
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .s-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      border-bottom: 1px solid #F9FAFB;
    }

    .s-card-header span:first-child { font-size: 20px; }

    .s-card-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .s-card-body { padding: 4px 20px 16px; }

    /* Field row */
    .field-row {
      padding: 12px 0;
      border-bottom: 1px solid #F9FAFB;
    }

    .field-row:last-child { border-bottom: none; }

    .field-label {
      font-size: 11px;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
    }

    .field-val {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .bmi-badge {
      background: #F0FDF4;
      color: #16A34A;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 13px;
    }

    .field-input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      background: #F9FAFB;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      outline: none;
    }

    .textarea-input {
      width: 100%;
      padding: 10px 12px;
      background: #F9FAFB;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      color: #111827;
      outline: none;
      resize: none;
      margin-top: 6px;
    }

    /* Chips */
    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      padding: 5px 12px;
      border-radius: 999px;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      border: 1.5px solid transparent;
      cursor: pointer;
    }

    .chip-active {
      background: rgba(140,240,0,0.14);
      color: #111827;
      border-color: #8CF000;
    }

    /* Toggle */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .toggle-btn {
      width: 48px; height: 26px;
      border-radius: 999px;
      background: #E5E7EB;
      border: none;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-on {
      background: #8CF000;
    }

    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }

    .toggle-thumb-on {
      transform: translateX(22px);
    }

    /* Skills */
    .skill-row { margin-bottom: 12px; }
    .skill-row:last-child { margin-bottom: 0; }

    .skill-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .skill-name { font-size: 12px; font-weight: 600; color: #374151; }
    .skill-pct { font-size: 12px; font-weight: 700; }

    .skill-bar {
      height: 6px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
    }

    .skill-fill {
      height: 100%;
      border-radius: 999px;
    }

    /* Privacy */
    .privacy-desc {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 10px;
    }

    .privacy-opts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .privacy-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 14px;
      background: #F3F4F6;
      border: 1.5px solid transparent;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      cursor: pointer;
    }

    .privacy-btn-active {
      background: rgba(140,240,0,0.12);
      border-color: #8CF000;
      color: #111827;
    }
  `]
})
export class StatsPage {
  private readonly router = inject(Router);

  editing = false;

  readonly bloodGroups = ['A+','A−','B+','B−','AB+','AB−','O+','O−'];
  readonly genders = ['Male','Female','Non-binary','Prefer not to say'];
  readonly hands = ['Right','Left','Ambidextrous'];
  readonly feet = ['Right','Left','Both'];
  readonly fitnessLevels = ['Beginner','Intermediate','Advanced','Professional'];
  readonly diets = ['Vegetarian','Vegan','Non-Vegetarian','Eggetarian'];
  readonly allSports = ['Cricket','Football','Basketball','Badminton','Tennis','Volleyball','Golf','Chess'];
  readonly privacyOpts = [
    { id:'only_me',   label:'Only Me',        icon:'🔒' },
    { id:'coach',     label:'My Coach',       icon:'🏋️' },
    { id:'team',      label:'My Team',        icon:'👥' },
    { id:'emergency', label:'Emergency Only', icon:'🚨' },
  ];

  readonly skills = [
    { name: 'Stamina & Pace', value: 85, color: '#8CF000' },
    { name: 'Ball Control', value: 78, color: '#8CF000' },
    { name: 'Teamwork', value: 92, color: '#FF7A00' },
    { name: 'Strategy', value: 70, color: '#38BDF8' },
    { name: 'Leadership', value: 65, color: '#8B5CF6' },
  ];

  stats = {
    height: 178,
    weight: 72,
    bloodGroup: 'B+',
    gender: 'Male',
    dominantHand: 'Right',
    dominantFoot: 'Right',
    sports: ['Cricket', 'Football'],
    fitnessLevel: 'Advanced',
    diet: 'Non-Vegetarian',
    hasInjuries: false,
    injuryDesc: '',
    hasAllergies: false,
    privacy: 'only_me',
  };

  getBmi() {
    const bmi = (this.stats.weight / Math.pow(this.stats.height / 100, 2)).toFixed(1);
    return bmi;
  }

  toggleSport(s: string) {
    const idx = this.stats.sports.indexOf(s);
    if (idx >= 0) this.stats.sports.splice(idx, 1);
    else this.stats.sports.push(s);
  }

  back() {
    this.router.navigateByUrl('/app/home');
  }
}
