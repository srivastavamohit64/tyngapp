import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachService } from '../../core/services/coach.service';

interface Court {
  id: number;
  name: string;
  sport: string;
  pricePerHour: number;
  maxPlayers: number;
  isIndoor: boolean;
  image: string;
}

interface Venue {
  id: number;
  name: string;
  address: string;
  image: string;
  openTime: string;
  closeTime: string;
  autoConfirm: boolean;
  amenities: string[];
  rentalEquipment: RentalItem[];
  courts: Court[];
}

interface RentalItem {
  id: string;
  label: string;
  emoji: string;
  qty: number;
  price: number;
}

interface Slot {
  startTime: string;
  endTime: string;
  label: string;
  endLabel: string;
  period: string;
}

interface Student {
  id: number;
  name: string;
  photo: string;
  sport: string;
}

interface DateOption {
  value: string;
  day: string;
  number: number;
  month: string;
  today: boolean;
}

const DURATIONS = [
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hours' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
];

@Component({
  selector: 'app-coach-venue-booking',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="page-shell">
      <main *ngIf="!success(); else successScreen" class="booking-page">
        <header class="topbar">
          <button type="button" (click)="previous()" aria-label="Back"><ion-icon name="chevron-back-outline"></ion-icon></button>
          <div><h1>{{ venue()?.name || 'Venue booking' }}</h1><p>Step {{ step() }} of 6</p></div>
          <button type="button" class="close" (click)="close()" aria-label="Close"><ion-icon name="close-outline"></ion-icon></button>
        </header>
        <div class="progress"><span *ngFor="let item of steps" [class.done]="step() > item" [class.current]="step() === item"></span></div>

        <div *ngIf="loadingVenue()" class="state full"><ion-spinner name="crescent"></ion-spinner><p>Loading venue details…</p></div>
        <div *ngIf="!loadingVenue() && loadError()" class="state full error"><ion-icon name="alert-circle-outline"></ion-icon><strong>Booking cannot be started</strong><p>{{ loadError() }}</p><button type="button" (click)="load()">Try again</button></div>

        <section *ngIf="venue() as selectedVenue" class="body">
          <div *ngIf="error()" class="error-banner"><ion-icon name="alert-circle-outline"></ion-icon><span>{{ error() }}</span><button type="button" (click)="error.set('')"><ion-icon name="close-outline"></ion-icon></button></div>

          <ng-container *ngIf="step() === 1">
            <div class="heading"><p>COURT &amp; SPORT</p><h2>Choose a playing area</h2><span>Only active courts that this venue accepts for booking are shown.</span></div>
            <div class="court-list">
              <button *ngFor="let court of selectedVenue.courts" type="button" [class.selected]="courtId() === court.id" (click)="selectCourt(court)">
                <span class="court-image"><img *ngIf="court.image" [src]="court.image" alt="" /><ion-icon *ngIf="!court.image" name="football-outline"></ion-icon></span>
                <span class="court-copy"><b>{{ court.name }}</b><small>{{ court.sport }} · {{ court.isIndoor ? 'Indoor' : 'Outdoor' }} · Up to {{ court.maxPlayers }} players</small></span>
                <span class="court-price"><b>₹{{ court.pricePerHour | number:'1.0-0' }}</b><small>/hour</small></span>
                <ion-icon class="check" [name]="courtId() === court.id ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon>
              </button>
            </div>
          </ng-container>

          <ng-container *ngIf="step() === 2">
            <div class="heading"><p>SESSION DATE</p><h2>Select a date</h2><span>Choose any date in the next two weeks.</span></div>
            <div class="date-strip">
              <button *ngFor="let date of dates" type="button" [class.selected]="selectedDate() === date.value" (click)="chooseDate(date.value)">
                <small>{{ date.today ? 'Today' : date.day }}</small><b>{{ date.number }}</b><span>{{ date.month }}</span>
              </button>
            </div>
            <article class="info-card"><ion-icon name="calendar-outline"></ion-icon><div><b>{{ selectedDate() | date:'EEEE, d MMMM y' }}</b><span>Availability will be checked live before you continue.</span></div></article>
          </ng-container>

          <ng-container *ngIf="step() === 3">
            <div class="heading"><p>LIVE AVAILABILITY</p><h2>Select duration and time</h2><span>Times already reserved by games or coaching sessions are removed automatically.</span></div>
            <label class="field-label">Session duration</label>
            <div class="duration-grid">
              <button *ngFor="let option of durations" type="button" [class.selected]="durationMinutes() === option.minutes" (click)="chooseDuration(option.minutes)">{{ option.label }}</button>
            </div>
            <div class="availability-line"><span><ion-icon name="time-outline"></ion-icon>{{ selectedVenue.openTime }} – {{ selectedVenue.closeTime }}</span><button type="button" (click)="loadAvailability()"><ion-icon name="refresh-outline"></ion-icon>Refresh</button></div>
            <div *ngIf="loadingSlots()" class="state slots"><ion-spinner name="crescent"></ion-spinner><p>Checking available times…</p></div>
            <div *ngIf="!loadingSlots() && slotError()" class="state slots error"><ion-icon name="cloud-offline-outline"></ion-icon><p>{{ slotError() }}</p><button type="button" (click)="loadAvailability()">Try again</button></div>
            <div *ngIf="!loadingSlots() && !slotError() && !slots().length" class="state slots"><ion-icon name="calendar-clear-outline"></ion-icon><strong>No times available</strong><p>Choose another date, duration, or court.</p><button type="button" (click)="step.set(2)">Change date</button></div>
            <div *ngIf="!loadingSlots() && slots().length" class="slot-groups">
              <section *ngFor="let period of slotPeriods()">
                <h3>{{ period }}</h3>
                <div class="slot-grid">
                  <button *ngFor="let slot of slotsFor(period)" type="button" [class.selected]="selectedTime() === slot.startTime" (click)="selectedTime.set(slot.startTime)"><b>{{ slot.label }}</b><small>to {{ slot.endLabel }}</small></button>
                </div>
              </section>
            </div>
          </ng-container>

          <ng-container *ngIf="step() === 4">
            <div class="heading"><p>PARTICIPANTS</p><h2>Select your students</h2><span>Choose active students who should receive this session invitation.</span></div>
            <div class="selection-summary"><span>{{ selectedStudentIds().length }} selected</span><small>Maximum {{ selectedCourt()?.maxPlayers || 1 }}</small></div>
            <div *ngIf="loadingStudents()" class="state slots"><ion-spinner name="crescent"></ion-spinner><p>Loading students…</p></div>
            <div *ngIf="!loadingStudents() && !students().length" class="state slots"><ion-icon name="people-outline"></ion-icon><strong>No active students</strong><p>Enrol or accept a student before creating a venue session.</p><button type="button" (click)="go('/app/coach/enroll-student')">Enrol student</button></div>
            <div class="student-list">
              <button *ngFor="let student of students(); trackBy: trackStudent" type="button" [class.selected]="isStudentSelected(student.id)" (click)="toggleStudent(student.id)">
                <span class="avatar"><img *ngIf="student.photo" [src]="student.photo" alt="" /><b *ngIf="!student.photo">{{ initials(student.name) }}</b></span>
                <span><b>{{ student.name }}</b><small>{{ student.sport || 'Player' }}</small></span>
                <ion-icon [name]="isStudentSelected(student.id) ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon>
              </button>
            </div>
          </ng-container>

          <ng-container *ngIf="step() === 5">
            <div class="heading"><p>SESSION DETAILS</p><h2>Finish the setup</h2><span>Add a title, training focus, and any equipment supplied by the venue.</span></div>
            <div class="form-card">
              <label>Session title<input [(ngModel)]="sessionTitle" maxlength="160" placeholder="e.g. Saturday batting practice" /></label>
              <label>Training focus<textarea [(ngModel)]="description" maxlength="4000" rows="3" placeholder="Goals or instructions for the students"></textarea></label>
            </div>
            <section *ngIf="selectedVenue.rentalEquipment.length" class="equipment-section">
              <div><h3>Rental equipment</h3><p>Optional · charged once per session</p></div>
              <article *ngFor="let item of selectedVenue.rentalEquipment">
                <span class="equipment-icon">{{ item.emoji || '🎽' }}</span><span class="equipment-copy"><b>{{ item.label }}</b><small>₹{{ item.price | number:'1.0-0' }} each · {{ item.qty }} available</small></span>
                <span class="stepper"><button type="button" (click)="changeEquipment(item,-1)">−</button><b>{{ equipmentQty(item.id) }}</b><button type="button" (click)="changeEquipment(item,1)">+</button></span>
              </article>
            </section>
          </ng-container>

          <ng-container *ngIf="step() === 6">
            <div class="heading"><p>REVIEW</p><h2>Confirm venue request</h2><span>Check the details before reserving this court.</span></div>
            <article class="review-card">
              <div class="review-venue"><span><ion-icon name="location-outline"></ion-icon></span><div><b>{{ selectedVenue.name }}</b><small>{{ selectedVenue.address }}</small></div></div>
              <dl>
                <div><dt>Court</dt><dd>{{ selectedCourt()?.name }} · {{ selectedCourt()?.sport }}</dd></div>
                <div><dt>Date</dt><dd>{{ selectedDate() | date:'EEE, d MMM y' }}</dd></div>
                <div><dt>Time</dt><dd>{{ selectedSlot()?.label }} – {{ selectedSlot()?.endLabel }}</dd></div>
                <div><dt>Students</dt><dd>{{ selectedStudentIds().length }}</dd></div>
                <div><dt>Approval</dt><dd>{{ selectedVenue.autoConfirm ? 'Instant confirmation' : 'Venue approval required' }}</dd></div>
              </dl>
            </article>
            <article class="price-card">
              <h3>Price breakdown</h3>
              <div><span>Court ({{ durationMinutes() / 60 | number:'1.0-1' }}h)</span><b>₹{{ courtCost() | number:'1.0-0' }}</b></div>
              <div *ngIf="equipmentCost()"><span>Equipment</span><b>₹{{ equipmentCost() | number:'1.0-0' }}</b></div>
              <div><span>Platform fee</span><b>₹49</b></div>
              <div><span>GST (18%)</span><b>₹{{ taxCost() | number:'1.0-0' }}</b></div>
              <div class="total"><span>Total session cost</span><b>₹{{ totalCost() | number:'1.0-0' }}</b></div>
              <small>₹{{ perStudentCost() | number:'1.0-0' }} per selected student</small>
            </article>
            <p class="approval-note"><ion-icon name="shield-checkmark-outline"></ion-icon>{{ selectedVenue.autoConfirm ? 'This venue confirms bookings automatically.' : 'The court is held while the venue reviews your request. Student invitations are sent after approval.' }}</p>
          </ng-container>
        </section>

        <footer *ngIf="venue() && !loadingVenue()" class="bottom-bar">
          <div><small>{{ footerLabel() }}</small><b>{{ footerValue() }}</b></div>
          <button type="button" [disabled]="!canContinue() || saving()" (click)="next()"><ion-spinner *ngIf="saving()" name="crescent"></ion-spinner><span>{{ saving() ? 'Reserving…' : (step() === 6 ? 'Confirm booking' : 'Continue') }}</span><ion-icon *ngIf="!saving()" name="chevron-forward-outline"></ion-icon></button>
        </footer>
      </main>

      <ng-template #successScreen>
        <main class="success-page">
          <span class="success-icon"><ion-icon name="checkmark-outline"></ion-icon></span>
          <p>VENUE REQUEST SAVED</p><h1>{{ confirmationTitle() }}</h1><span>{{ confirmationMessage() }}</span>
          <article><div *ngFor="let item of confirmationItems()"><ion-icon name="checkmark-circle"></ion-icon><span>{{ item }}</span></div></article>
          <button type="button" class="primary" (click)="go('/app/coach/schedule')">View my schedule</button>
          <button type="button" class="secondary" (click)="go('/app/coach/dashboard')">Go to dashboard</button>
        </main>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    :host{display:block;--lime:var(--app-primary,#7cf000);--ink:#101828;--muted:#667085;--line:#e7ebef}.page-shell{--background:#f8fafb}.booking-page{min-height:100%;padding-bottom:calc(92px + env(safe-area-inset-bottom));color:var(--ink);background:#f8fafb}.topbar{position:sticky;top:0;z-index:30;height:calc(58px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 16px 0;display:grid;grid-template-columns:42px minmax(0,1fr) 42px;align-items:center;border-bottom:1px solid var(--line);background:rgba(255,255,255,.97);backdrop-filter:blur(14px)}.topbar button{width:38px;height:38px;padding:0;border:0;border-radius:13px;display:grid;place-items:center;color:var(--ink);background:#f2f4f7;font-size:20px}.topbar .close{justify-self:end}.topbar div{text-align:center;min-width:0}.topbar h1{margin:0;overflow:hidden;font-size:14px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.topbar p{margin:2px 0 0;color:#98a2b3;font-size:9px;font-weight:750}.progress{position:sticky;top:calc(58px + env(safe-area-inset-top));z-index:29;height:30px;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:1px solid #f1f3f5;background:rgba(255,255,255,.97)}.progress span{width:8px;height:6px;border-radius:999px;background:#e4e7ec;transition:.18s}.progress span.done{background:#ff7a00}.progress span.current{width:27px;background:var(--lime)}.body{width:min(100%,440px);margin:0 auto;padding:22px 16px;box-sizing:border-box}.heading{margin-bottom:18px}.heading>p{margin:0 0 5px;color:#6bd000;font-size:9px;font-weight:900;letter-spacing:.11em}.heading h2{margin:0 0 5px;font-size:23px;line-height:1.15;font-weight:900;letter-spacing:-.4px}.heading>span{display:block;color:var(--muted);font-size:11px;line-height:1.45}.error-banner{margin-bottom:15px;padding:10px 11px;border-radius:13px;display:grid;grid-template-columns:18px 1fr 24px;gap:7px;color:#b42318;background:#fef3f2;font-size:10px;line-height:1.4}.error-banner button{padding:0;border:0;color:inherit;background:transparent}.state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--muted);text-align:center}.state.full{min-height:480px;padding:24px}.state.slots{min-height:180px}.state ion-spinner{color:var(--lime)}.state>ion-icon{color:#6bd20a;font-size:34px}.state.error>ion-icon{color:#f04438}.state strong{color:var(--ink);font-size:14px}.state p{max-width:270px;margin:0;font-size:10.5px;line-height:1.45}.state button{padding:10px 14px;border:0;border-radius:11px;color:#203600;background:var(--lime);font-size:10px;font-weight:800}.court-list,.student-list{display:grid;gap:9px}.court-list>button{position:relative;width:100%;min-height:78px;padding:10px 38px 10px 10px;border:1.5px solid var(--line);border-radius:18px;display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:11px;align-items:center;color:var(--ink);background:#fff;text-align:left}.court-list>button.selected{border-color:var(--lime);background:#f7ffed}.court-image{width:54px;height:54px;border-radius:14px;overflow:hidden;display:grid;place-items:center;color:#68ca08;background:#eefbdc;font-size:24px}.court-image img{width:100%;height:100%;object-fit:cover}.court-copy{min-width:0;display:grid;gap:4px}.court-copy b{font-size:12px}.court-copy small{color:var(--muted);font-size:8.5px;line-height:1.35}.court-price{display:grid;text-align:right}.court-price b{font-size:11px}.court-price small{color:#98a2b3;font-size:7px}.court-list .check{position:absolute;top:8px;right:8px;color:#69d000;font-size:18px}.date-strip{display:flex;gap:8px;overflow-x:auto;padding:2px 1px 8px;scrollbar-width:none}.date-strip::-webkit-scrollbar{display:none}.date-strip button{min-width:62px;height:74px;padding:7px;border:1.5px solid var(--line);border-radius:17px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--ink);background:#fff}.date-strip button.selected{border-color:var(--lime);background:#f3ffe5;box-shadow:0 4px 14px rgba(107,208,0,.13)}.date-strip small,.date-strip span{color:#98a2b3;font-size:8px;font-weight:750}.date-strip b{margin:3px 0;font-size:20px}.date-strip button.selected small{color:#58b800}.info-card{margin-top:18px;padding:13px;border:1px solid var(--line);border-radius:16px;display:flex;gap:10px;align-items:center;background:#fff}.info-card>ion-icon{width:35px;height:35px;padding:8px;box-sizing:border-box;border-radius:11px;color:#5ebc00;background:#edffdc}.info-card div{display:grid;gap:3px}.info-card b{font-size:11px}.info-card span{color:#98a2b3;font-size:8.5px}.field-label{display:block;margin-bottom:8px;color:#475467;font-size:10px;font-weight:800}.duration-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.duration-grid button{height:43px;border:1.5px solid var(--line);border-radius:13px;color:#667085;background:#fff;font:inherit;font-size:10.5px;font-weight:750}.duration-grid button.selected{border-color:var(--lime);color:#233b00;background:#f1ffdf}.availability-line{margin:17px 0 10px;display:flex;justify-content:space-between;align-items:center;color:#667085;font-size:9px}.availability-line span,.availability-line button{display:flex;align-items:center;gap:5px}.availability-line button{border:0;color:#4c9400;background:transparent;font-size:9px;font-weight:800}.slot-groups{display:grid;gap:16px}.slot-groups h3{margin:0 0 8px;color:#475467;font-size:10px}.slot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.slot-grid button{min-width:0;height:51px;padding:5px;border:1.5px solid var(--line);border-radius:14px;display:grid;place-content:center;gap:3px;color:#475467;background:#fff;font:inherit}.slot-grid button.selected{border-color:var(--lime);color:#203600;background:var(--lime);box-shadow:0 4px 12px rgba(109,208,0,.2)}.slot-grid b{font-size:10.5px}.slot-grid small{font-size:7px;opacity:.72}.selection-summary{margin-bottom:9px;display:flex;justify-content:space-between;color:#667085;font-size:9px;font-weight:750}.student-list button{width:100%;height:64px;padding:8px 11px;border:1.5px solid var(--line);border-radius:17px;display:grid;grid-template-columns:43px minmax(0,1fr) 22px;gap:10px;align-items:center;color:var(--ink);background:#fff;text-align:left}.student-list button.selected{border-color:var(--lime);background:#f6ffeb}.avatar{width:43px;height:43px;border-radius:50%;overflow:hidden;display:grid;place-items:center;color:#315300;background:#eaffcf;font-size:11px}.avatar img{width:100%;height:100%;object-fit:cover}.student-list button>span:nth-child(2){min-width:0;display:grid;gap:3px}.student-list button>span b,.student-list button>span small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.student-list button>span b{font-size:11px}.student-list button>span small{color:#667085;font-size:8.5px}.student-list button>ion-icon{color:#6bd000;font-size:20px}.form-card{padding:14px;border:1px solid var(--line);border-radius:18px;display:grid;gap:14px;background:#fff}.form-card label{display:grid;gap:6px;color:#475467;font-size:9.5px;font-weight:800}.form-card input,.form-card textarea{width:100%;box-sizing:border-box;border:1px solid #eaecf0;border-radius:12px;outline:0;color:var(--ink);background:#f9fafb;font:inherit;font-size:11px}.form-card input{height:43px;padding:0 12px}.form-card textarea{padding:11px 12px;resize:vertical}.form-card input:focus,.form-card textarea:focus{border-color:var(--lime)}.equipment-section{margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:18px;background:#fff}.equipment-section>div h3{margin:0;font-size:12px}.equipment-section>div p{margin:2px 0 10px;color:#98a2b3;font-size:8px}.equipment-section article{min-height:51px;border-top:1px solid #f2f4f7;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:9px;align-items:center}.equipment-icon{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#f2f4f7}.equipment-copy{min-width:0;display:grid;gap:2px}.equipment-copy b{font-size:10px}.equipment-copy small{color:#98a2b3;font-size:7.5px}.stepper{display:flex;align-items:center;gap:8px}.stepper button{width:28px;height:28px;padding:0;border:0;border-radius:9px;color:#345600;background:#eaffd1;font-size:17px}.stepper b{width:12px;text-align:center;font-size:10px}.review-card,.price-card{padding:15px;border:1px solid var(--line);border-radius:19px;background:#fff}.review-venue{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid #f1f3f5}.review-venue>span{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;color:#58ae00;background:#ecffda}.review-venue div{min-width:0;display:grid;gap:3px}.review-venue b,.review-venue small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.review-venue b{font-size:12px}.review-venue small{color:#667085;font-size:8px}.review-card dl{margin:11px 0 0;display:grid;gap:8px}.review-card dl div{display:flex;justify-content:space-between;gap:15px}.review-card dt{color:#98a2b3;font-size:9px}.review-card dd{margin:0;font-size:9px;font-weight:750;text-align:right}.price-card{margin-top:11px}.price-card h3{margin:0 0 8px;font-size:12px}.price-card>div{padding:7px 0;display:flex;justify-content:space-between;color:#667085;font-size:9px}.price-card>div b{color:#344054}.price-card .total{margin-top:5px;padding-top:12px;border-top:1px solid #eaecf0;color:var(--ink);font-size:11px;font-weight:850}.price-card .total b{color:#55ae00;font-size:16px}.price-card>small{display:block;color:#98a2b3;font-size:8px;text-align:right}.approval-note{margin:11px 0 0;padding:11px;border-radius:13px;display:flex;gap:7px;color:#526938;background:#f2fbe8;font-size:9px;line-height:1.4}.approval-note ion-icon{flex:0 0 auto;font-size:16px}.bottom-bar{position:fixed;right:0;bottom:0;left:0;z-index:30;padding:11px 16px calc(11px + env(safe-area-inset-bottom));border-top:1px solid var(--line);display:flex;align-items:center;gap:13px;background:rgba(255,255,255,.97);box-shadow:0 -7px 20px rgba(16,24,40,.06);backdrop-filter:blur(13px)}.bottom-bar>div{min-width:73px;display:grid;gap:2px}.bottom-bar small{color:#98a2b3;font-size:8px}.bottom-bar b{overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.bottom-bar>button{min-width:0;height:49px;flex:1;border:0;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:6px;color:#fff;background:linear-gradient(135deg,#ff7800,#ff9b43);font:inherit;font-size:12px;font-weight:850;box-shadow:0 6px 15px rgba(255,122,0,.24)}.bottom-bar>button:disabled{color:#98a2b3;background:#eaecf0;box-shadow:none}.bottom-bar ion-spinner{width:17px;height:17px}.success-page{width:min(100%,430px);min-height:100%;margin:0 auto;padding:calc(50px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--ink);background:#f8fafb;text-align:center}.success-icon{width:82px;height:82px;border-radius:50%;display:grid;place-items:center;color:#213700;background:var(--lime);font-size:38px;box-shadow:0 12px 30px rgba(105,205,0,.23)}.success-page>p{margin:21px 0 5px;color:#67c900;font-size:9px;font-weight:900;letter-spacing:.12em}.success-page h1{margin:0;font-size:24px}.success-page>span:not(.success-icon){max-width:330px;margin:8px 0 18px;color:#667085;font-size:11px;line-height:1.5}.success-page article{width:100%;padding:8px 13px;box-sizing:border-box;border:1px solid var(--line);border-radius:18px;background:#fff;text-align:left}.success-page article div{min-height:40px;border-bottom:1px solid #f2f4f7;display:flex;align-items:center;gap:8px;font-size:10px;font-weight:750}.success-page article div:last-child{border:0}.success-page article ion-icon{color:#5fc200;font-size:17px}.success-page>button{width:100%;height:49px;border-radius:15px;font:inherit;font-size:11px;font-weight:850}.success-page .primary{margin-top:13px;border:0;color:#1d3100;background:var(--lime)}.success-page .secondary{margin-top:8px;border:1px solid var(--line);color:#475467;background:#fff}@media(min-width:700px){.topbar{grid-template-columns:42px minmax(0,350px) 42px;justify-content:center}.bottom-bar{justify-content:center}.bottom-bar>div{width:90px}.bottom-bar>button{max-width:330px}}
  `],
})
export class CoachVenueBookingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly coach = inject(CoachService);
  private readonly navigationVenue = this.router.getCurrentNavigation()?.extras?.state?.['venue'];
  readonly steps = [1, 2, 3, 4, 5, 6];
  readonly durations = DURATIONS;
  readonly dates = this.buildDates();
  readonly step = signal(1);
  readonly venue = signal<Venue | null>(null);
  readonly loadingVenue = signal(true);
  readonly loadError = signal('');
  readonly courtId = signal<number | null>(null);
  readonly selectedDate = signal(this.dates[0].value);
  readonly durationMinutes = signal(60);
  readonly slots = signal<Slot[]>([]);
  readonly loadingSlots = signal(false);
  readonly slotError = signal('');
  readonly selectedTime = signal('');
  readonly students = signal<Student[]>([]);
  readonly loadingStudents = signal(true);
  readonly selectedStudentIds = signal<number[]>([]);
  readonly equipment = signal<Record<string, number>>({});
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal(false);
  readonly confirmation = signal<any | null>(null);
  readonly confirmationMessage = signal('');
  sessionTitle = '';
  description = '';

  readonly selectedCourt = computed(() => this.venue()?.courts.find(court => court.id === this.courtId()) || null);
  readonly selectedSlot = computed(() => this.slots().find(slot => slot.startTime === this.selectedTime()) || null);
  readonly slotPeriods = computed(() => [...new Set(this.slots().map(slot => slot.period))]);

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loadingVenue.set(true); this.loadError.set(''); this.loadingStudents.set(true);
    try {
      const venueId = Number(this.route.snapshot.queryParamMap.get('venue') || this.navigationVenue?.id || 0);
      const [venuesResponse, studentsResponse] = await Promise.all([
        firstValueFrom(this.coach.getSchedulingVenues()),
        firstValueFrom(this.coach.getStudents()),
      ]);
      const venueRows = Array.isArray(venuesResponse.data) ? venuesResponse.data : [];
      const rawVenue = this.navigationVenue || venueRows.find((item: any) => Number(item.id) === venueId);
      if (!rawVenue) throw new Error('Choose a venue from the Book Venue page.');
      const mappedVenue = this.mapVenue(rawVenue);
      if (!mappedVenue.courts.length) throw new Error('This venue has no active courts available for booking.');
      this.venue.set(mappedVenue);
      this.selectCourt(mappedVenue.courts[0], false);
      const data: any = studentsResponse.data;
      const rows = Array.isArray(data) ? data : data?.data || [];
      this.students.set(rows.filter((row: any) => row.status === 'active' && row.student).map((row: any) => ({
        id: Number(row.student.id), name: String(row.student.name || 'Student'), photo: String(row.student.profile_image || ''),
        sport: Array.isArray(row.student.sports) ? row.student.sports.join(', ') : String(row.student.sports || ''),
      })));
      await this.loadAvailability();
    } catch (error: any) {
      this.loadError.set(error?.error?.message || error?.message || 'Unable to load the booking flow.');
    } finally { this.loadingVenue.set(false); this.loadingStudents.set(false); }
  }

  async loadAvailability(): Promise<void> {
    const venue = this.venue(); const court = this.selectedCourt();
    if (!venue || !court) return;
    this.loadingSlots.set(true); this.slotError.set(''); this.selectedTime.set('');
    try {
      const response = await firstValueFrom(this.coach.getVenueAvailability(venue.id, court.id, this.selectedDate(), this.durationMinutes()));
      const payload: any = response.data || {};
      this.slots.set(Array.isArray(payload.slots) ? payload.slots : []);
    } catch (error: any) {
      this.slots.set([]); this.slotError.set(this.apiError(error, 'Available times could not be loaded.'));
    } finally { this.loadingSlots.set(false); }
  }

  selectCourt(court: Court, reload = true): void {
    this.courtId.set(court.id); this.selectedStudentIds.set([]); this.selectedTime.set('');
    if (!this.sessionTitle) this.sessionTitle = `${court.sport} coaching session`;
    if (reload) void this.loadAvailability();
  }
  chooseDate(value: string): void { this.selectedDate.set(value); void this.loadAvailability(); }
  chooseDuration(minutes: number): void { this.durationMinutes.set(minutes); void this.loadAvailability(); }
  slotsFor(period: string): Slot[] { return this.slots().filter(slot => slot.period === period); }
  isStudentSelected(id: number): boolean { return this.selectedStudentIds().includes(id); }
  toggleStudent(id: number): void {
    const current = this.selectedStudentIds();
    if (current.includes(id)) { this.selectedStudentIds.set(current.filter(item => item !== id)); return; }
    const maximum = this.selectedCourt()?.maxPlayers || 1;
    if (current.length >= maximum) { this.error.set(`This court allows up to ${maximum} players.`); return; }
    this.selectedStudentIds.set([...current, id]); this.error.set('');
  }
  trackStudent(_index: number, student: Student): number { return student.id; }
  initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  equipmentQty(id: string): number { return this.equipment()[id] || 0; }
  changeEquipment(item: RentalItem, delta: number): void {
    const next = Math.max(0, Math.min(item.qty || 0, this.equipmentQty(item.id) + delta));
    this.equipment.update(current => ({ ...current, [item.id]: next }));
  }

  canContinue(): boolean {
    if (this.step() === 1) return !!this.selectedCourt();
    if (this.step() === 2) return !!this.selectedDate();
    if (this.step() === 3) return !!this.selectedSlot() && !this.loadingSlots();
    if (this.step() === 4) return this.selectedStudentIds().length > 0;
    if (this.step() === 5) return this.sessionTitle.trim().length >= 3;
    return !this.saving();
  }

  async next(): Promise<void> {
    this.error.set('');
    if (!this.canContinue()) return;
    if (this.step() < 6) { this.step.update(value => value + 1); return; }
    await this.submit();
  }
  previous(): void { if (this.step() > 1) this.step.update(value => value - 1); else this.close(); }
  close(): void { void this.router.navigateByUrl('/app/coach/book-venue'); }
  go(path: string): void { void this.router.navigateByUrl(path); }

  private async submit(): Promise<void> {
    const venue = this.venue(); const court = this.selectedCourt(); const slot = this.selectedSlot();
    if (!venue || !court || !slot) return;
    this.saving.set(true);
    try {
      const selectedEquipment = venue.rentalEquipment.filter(item => this.equipmentQty(item.id) > 0).map(item => ({ id: item.id, qty: this.equipmentQty(item.id) }));
      const response = await firstValueFrom(this.coach.createSession({
        title: this.sessionTitle.trim(), sport: court.sport, description: this.description.trim() || null,
        venue_court_id: court.id, student_ids: this.selectedStudentIds(), session_date: this.selectedDate(),
        start_time: slot.startTime, end_time: slot.endTime, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        coach_fee: 0, equipment: selectedEquipment,
      }));
      this.confirmation.set(response.data); this.confirmationMessage.set(response.message || 'Your venue session has been created.'); this.success.set(true);
    } catch (error: any) {
      this.error.set(this.apiError(error, 'The venue could not be reserved. Please check availability and try again.'));
      if (error?.status === 422) { await this.loadAvailability(); this.step.set(3); }
    } finally { this.saving.set(false); }
  }

  courtCost(): number { return (this.selectedCourt()?.pricePerHour || 0) * (this.durationMinutes() / 60); }
  equipmentCost(): number { const venue = this.venue(); return venue ? venue.rentalEquipment.reduce((sum, item) => sum + item.price * this.equipmentQty(item.id), 0) : 0; }
  taxCost(): number { return Math.round((this.courtCost() + this.equipmentCost() + 49) * .18); }
  totalCost(): number { return Math.round(this.courtCost() + this.equipmentCost() + 49 + this.taxCost()); }
  perStudentCost(): number { return Math.round(this.totalCost() / Math.max(1, this.selectedStudentIds().length)); }
  footerLabel(): string { return this.step() === 3 ? 'Available times' : this.step() === 4 ? 'Students selected' : this.step() === 6 ? 'Total session cost' : 'Current selection'; }
  footerValue(): string {
    if (this.step() === 1) return this.selectedCourt()?.sport || 'Choose court';
    if (this.step() === 2) return new Date(this.selectedDate() + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (this.step() === 3) return this.slots().length + ' slots';
    if (this.step() === 4) return this.selectedStudentIds().length + ' students';
    if (this.step() === 5) return '₹' + this.equipmentCost().toLocaleString('en-IN');
    return '₹' + this.totalCost().toLocaleString('en-IN');
  }
  confirmationTitle(): string { return this.confirmation()?.status === 'confirmed' ? 'Booking confirmed!' : 'Request sent to venue'; }
  confirmationItems(): string[] {
    const confirmed = this.confirmation()?.status === 'confirmed';
    return [confirmed ? 'Court reserved and confirmed' : 'Court held while venue reviews', `${this.selectedStudentIds().length} student invitation${this.selectedStudentIds().length === 1 ? '' : 's'} prepared`, 'Session added to your coach schedule', 'Live availability updated'];
  }

  private mapVenue(item: any): Venue {
    const courts: Court[] = (Array.isArray(item.courts) ? item.courts : []).map((court: any) => ({
      id: Number(court.id), name: String(court.name || 'Court'), sport: this.titleCase(court.sport || 'Sport'), pricePerHour: Number(court.price_per_hour ?? court.pricePerHour ?? 0),
      maxPlayers: Math.max(1, Number(court.max_players ?? court.maxPlayers ?? 1)), isIndoor: !!(court.is_indoor ?? court.isIndoor), image: String(court.image || ''),
    }));
    const rentalEquipment: RentalItem[] = (Array.isArray(item.rental_equipment ?? item.rentalEquipment) ? (item.rental_equipment ?? item.rentalEquipment) : []).map((equipment: any) => ({
      id: String(equipment.id), label: String(equipment.label || equipment.name || 'Equipment'), emoji: String(equipment.emoji || '🎽'), qty: Math.max(0, Number(equipment.qty || equipment.quantity || 0)), price: Math.max(0, Number(equipment.price || 0)),
    })).filter((item: RentalItem) => item.id && item.qty > 0);
    return { id: Number(item.id), name: String(item.name || 'Venue'), address: String(item.address || item.location || ''), image: String(item.image || ''), openTime: String(item.open_time || item.openTime || '6:00 AM'), closeTime: String(item.close_time || item.closeTime || '10:00 PM'), autoConfirm: !!(item.auto_confirm ?? item.autoConfirm), amenities: Array.isArray(item.amenities) ? item.amenities.map(String) : [], rentalEquipment, courts };
  }
  private buildDates(): DateOption[] {
    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { value, day: date.toLocaleDateString('en-IN', { weekday: 'short' }), number: date.getDate(), month: date.toLocaleDateString('en-IN', { month: 'short' }), today: index === 0 };
    });
  }
  private titleCase(value: unknown): string { return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); }
  private apiError(error: any, fallback: string): string {
    const errors = error?.error?.errors;
    if (errors && typeof errors === 'object') {
      const values = Object.values(errors) as unknown[];
      const first = values.reduce<unknown[]>((messages, value) => messages.concat(Array.isArray(value) ? value : [value]), [])[0];
      if (first) return String(first);
    }
    return error?.error?.message || error?.message || fallback;
  }
}
