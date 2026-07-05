import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SegmentControlComponent } from '../../shared/components/segment-control/segment-control.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, SegmentControlComponent],
  template: `
    <ion-content fullscreen class="has-tabs">
      <app-brand-header-shell>
      <main class="page-with-tab-bar min-h-full bg-[#FAFBFC] text-[#111827]">
        <app-page-header title="My Bookings" [hasSubContent]="true">
          <app-segment-control
            [options]="segments"
            [value]="activeSegment"
            (valueChange)="activeSegment = $event"
          ></app-segment-control>
        </app-page-header>

        <div class="px-4 pt-4 pb-36 space-y-4">
          <ng-container *ngIf="activeSegment === 'upcoming'">
            <div
              class="bg-white overflow-hidden rounded-3xl"
              style="box-shadow: 0 2px 16px rgba(0,0,0,0.08); border-left: 4px solid #22C55E;"
            >
              <div class="px-4 pt-4 pb-3">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">🏏</span>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[15px] font-black text-[#111827]">Weekend Cricket Match</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8CF000]/15 text-[#16A34A]">
                          Captain
                        </span>
                      </div>
                      <p class="text-[12px] text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                        <ion-icon name="location-outline" class="text-[10px]"></ion-icon>
                        BRSABV Ekana Cricket Stadium
                      </p>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] flex-shrink-0 ml-2">
                    Confirmed
                  </span>
                </div>

                <div class="flex items-center gap-3 flex-wrap">
                  <div class="flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <ion-icon name="calendar-outline" class="text-[11px]"></ion-icon>
                    Today, 29 Jun
                  </div>
                  <div class="flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <ion-icon name="time-outline" class="text-[11px]"></ion-icon>
                    7:00 PM
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#FF7A00] flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-[#FF7A00]"></span>
                    Starts in 2h 15m
                  </span>
                </div>
              </div>

              <div class="px-4 pb-3">
                <div class="bg-[#FAFBFC] border border-[#F3F4F6] rounded-2xl p-3.5 grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Players</p>
                    <p class="text-[12px] font-bold text-[#111827]">14/22</p>
                    <p class="text-[9px] text-[#FF7A00] font-bold">8 seats left</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Payment</p>
                    <p class="text-[12px] font-bold text-[#111827]">Split Equally</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Duration</p>
                    <p class="text-[12px] font-bold text-[#111827]">3 hours</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Venue Booked</p>
                    <p class="text-[12px] font-bold text-[#16A34A]">✓ Confirmed</p>
                  </div>
                </div>
              </div>

              <div class="px-4 mb-3">
                <div class="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3.5">
                  <h4 class="text-[12px] font-black text-[#92400E] flex items-center gap-1">
                    ⏰ Captain Decision Required
                  </h4>
                  <p class="text-[11px] text-[#B45309] mt-1 leading-relaxed">
                    Game starts in <span class="font-bold">2h 15m</span>. You must decide to continue or cancel before it begins.
                  </p>
                  <div class="flex gap-2 mt-3">
                    <button
                      (click)="alertAction('continued')"
                      class="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-[#111827]"
                      style="background: linear-gradient(135deg,#8CF000,#A3E635); box-shadow: 0 2px 8px rgba(140,240,0,0.28);"
                    >
                      ✓ Continue Game
                    </button>
                    <button
                      (click)="alertAction('cancelled')"
                      class="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white bg-[#EF4444]"
                    >
                      ✗ Cancel Game
                    </button>
                  </div>
                </div>
              </div>

              <div class="px-4 pb-4">
                <p class="text-[10px] font-black uppercase text-[#9CA3AF] tracking-wider mb-2.5">Captain Actions</p>
                <div class="grid grid-cols-4 gap-2">
                  <button class="action-chip">
                    <ion-icon name="create-outline" class="text-lg text-[#6B7280]"></ion-icon>
                    <span class="text-[10px] font-semibold text-[#6B7280]">Edit Rules</span>
                  </button>
                  <button class="action-chip action-chip--accent">
                    <ion-icon name="megaphone-outline" class="text-lg text-[#16A34A]"></ion-icon>
                    <span class="text-[10px] font-semibold text-[#16A34A]">Announce</span>
                  </button>
                  <button class="action-chip">
                    <ion-icon name="person-add-outline" class="text-lg text-[#6B7280]"></ion-icon>
                    <span class="text-[10px] font-semibold text-[#6B7280]">Invite</span>
                  </button>
                  <button (click)="goChat()" class="action-chip">
                    <ion-icon name="chatbubble-outline" class="text-lg text-[#6B7280]"></ion-icon>
                    <span class="text-[10px] font-semibold text-[#6B7280]">Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="activeSegment === 'past'">
            <div
              class="bg-white overflow-hidden rounded-3xl opacity-[0.82]"
              style="box-shadow: 0 1px 8px rgba(0,0,0,0.05); border-left: 4px solid #22C55E; filter: saturate(0.7);"
            >
              <div class="px-4 py-4 flex justify-between items-center">
                <div>
                  <span class="text-[10px] font-bold text-[#9CA3AF]">🏏 Cricket</span>
                  <h3 class="text-[15px] font-black text-[#111827] mt-1">Thursday Cricket Game</h3>
                  <p class="text-[12px] text-[#9CA3AF] mt-0.5">BRSABV Ekana Cricket Stadium</p>
                </div>
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                  Completed
                </span>
              </div>
            </div>
          </ng-container>
        </div>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .action-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border-radius: 18px;
        background: #f9fafb;
        border: 1.5px solid #f3f4f6;
        min-height: unset;
      }

      .action-chip--accent {
        background: rgba(140, 240, 0, 0.12);
        border-color: rgba(140, 240, 0, 0.3);
      }
    `,
  ],
})
export class MyBookingsPage {
  private readonly router = inject(Router);

  activeSegment = 'upcoming';

  readonly segments = [
    { id: 'upcoming', label: 'Upcoming (3)' },
    { id: 'past', label: 'Past (3)' },
  ];

  goChat() {
    void this.router.navigateByUrl('/app/chat');
  }

  alertAction(action: string) {
    alert(`Game status updated: ${action.toUpperCase()}`);
  }
}
