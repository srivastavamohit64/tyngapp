import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { QuickAction, QuickActionChipsComponent } from '../../shared/components/quick-action-chips/quick-action-chips.component';

interface Message {
  id: number;
  text: string;
  time: string;
  sender: string;
  avatar: string;
  reactions?: string;
  isSelf?: boolean;
}

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, QuickActionChipsComponent],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar flex flex-col min-h-full bg-white text-slate-800 select-none">
        
        <!-- Custom Header Matching Image 2 -->
        <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div class="flex items-center gap-2">
            <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-transparent text-slate-800 active:scale-95 transition-all">
              <ion-icon name="chevron-back-outline" class="text-2xl"></ion-icon>
            </button>
            <div class="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 text-2xl">
              🏏
            </div>
            <div>
              <h1 class="text-sm font-extrabold text-slate-900 leading-tight">Lucknow Cricket Club</h1>
              <p class="text-[10px] text-slate-400 font-bold mt-0.5">18 members &bull; 6 active</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button (click)="callGroup()" class="h-10 w-10 grid place-items-center rounded-full bg-transparent text-slate-700 active:scale-95 transition-all">
              <ion-icon name="call-outline" class="text-xl"></ion-icon>
            </button>
            <button (click)="showInfo()" class="h-10 w-10 grid place-items-center rounded-full bg-transparent text-slate-700 active:scale-95 transition-all">
              <ion-icon name="information-circle-outline" class="text-2xl"></ion-icon>
            </button>
          </div>
        </header>

        <!-- Match Details Pin Card (Expandable) -->
        <div class="px-4 pt-4">
          <div class="bg-[#FAFBFC] border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <!-- Pin Card Header -->
            <button 
              (click)="isDetailsExpanded = !isDetailsExpanded" 
              class="w-full px-5 py-3.5 flex items-center justify-between text-left bg-transparent border-none outline-none cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-full bg-[#111827] flex items-center justify-center text-base">
                  📌
                </div>
                <span class="font-extrabold text-sm text-[#111827] tracking-tight">Today's Match &bull; Elite Cricket Arena</span>
              </div>
              <ion-icon 
                [name]="isDetailsExpanded ? 'chevron-up-outline' : 'chevron-down-outline'" 
                class="text-slate-400 text-lg transition-transform duration-200"
              ></ion-icon>
            </button>

            <!-- Card Inner Details Grid -->
            <div 
              *ngIf="isDetailsExpanded" 
              class="px-5 pb-5 pt-1 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-slate-100/60 bg-white"
            >
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Venue</span>
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                  📍 Elite Cricket Arena
                </span>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Time</span>
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                  ⏰ 7:00 PM today
                </span>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Players</span>
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                  👥 10/12 confirmed
                </span>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Payment</span>
                <span class="text-xs font-black text-slate-900 flex items-center gap-1">
                  💳 ₹420 paid <span class="text-green-600 font-bold ml-0.5">✓</span>
                </span>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Weather</span>
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                  ☀️ 28°C, Partly cloudy
                </span>
              </div>
              <div class="space-y-1">
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Rating</span>
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1">
                  ⭐️ Ekana &bull; 4.8
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Feed Area -->
        <section class="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#FDFDFD]">
          
          <!-- System Confirmation Bubble -->
          <div class="text-center my-3">
            <span class="bg-[#EEF1F6] text-slate-500 font-extrabold px-5 py-2 rounded-full text-xs inline-block shadow-sm">
              Match confirmed for tonight at 7:00 PM
            </span>
          </div>

          <!-- Messages Loop -->
          <div *ngFor="let msg of messages" class="flex flex-col">
            <!-- Bubble Structure -->
            <div class="flex gap-3 max-w-[85%]" [class.self-end]="msg.isSelf" [class.flex-row-reverse]="msg.isSelf">
              <!-- Profile Avatar -->
              <div *ngIf="!msg.isSelf" class="h-9 w-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-base flex-shrink-0 shadow-sm border border-slate-100">
                {{ msg.avatar }}
              </div>

              <!-- Message Text and Meta -->
              <div class="flex flex-col">
                <!-- Sender Name -->
                <span *ngIf="!msg.isSelf" class="text-[10px] text-slate-400 font-black ml-1.5 mb-1">{{ msg.sender }}</span>
                
                <!-- Bubble Container with Reaction Badge -->
                <div class="relative">
                  <div 
                    class="p-3.5 rounded-3xl text-sm leading-relaxed" 
                    [class.bg-[#8CF000]]="msg.isSelf" 
                    [class.text-[#111827]]="msg.isSelf"
                    [class.bg-[#F0F2F5]]="!msg.isSelf"
                    [class.text-slate-800]="!msg.isSelf"
                    [style.borderTopLeftRadius]="!msg.isSelf ? '4px' : null"
                    [style.borderTopRightRadius]="msg.isSelf ? '4px' : null"
                  >
                    {{ msg.text }}
                  </div>

                  <!-- Overlay Reaction Badge -->
                  <div 
                    *ngIf="msg.reactions" 
                    class="absolute -bottom-2 right-2 bg-white border border-slate-100 shadow-sm rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1 font-bold text-slate-600"
                  >
                    {{ msg.reactions }}
                  </div>
                </div>

                <!-- Time display -->
                <span class="text-[9px] text-slate-400 font-bold mt-1.5 px-1.5" [class.self-end]="msg.isSelf">{{ msg.time }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick actions + input (Figma ChatRoomScreen footer) -->
        <section class="bg-white border-t border-[#F3F4F6] sticky bottom-0 z-20">
          <app-quick-action-chips
            [actions]="quickActions"
            (actionClick)="onQuickAction($event)"
          ></app-quick-action-chips>

          <div class="flex gap-2.5 items-center px-4 pb-4">
            <input 
              class="h-12 flex-1 rounded-xl border border-slate-100 bg-[#FAFBFC] px-4 outline-none text-sm font-medium focus:border-[#8CF000] focus:bg-white" 
              placeholder="Type a message..." 
              [(ngModel)]="newMessageText" 
              (keyup.enter)="sendMessage()" 
            />
            <button 
              (click)="sendMessage()" 
              [disabled]="!newMessageText.trim()"
              class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] shadow-sm disabled:opacity-50 transition-all border-none outline-none cursor-pointer"
            >
              <ion-icon name="send" class="text-lg"></ion-icon>
            </button>
          </div>
        </section>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .self-end {
        align-self: flex-end;
      }
      .flex-row-reverse {
        flex-direction: row-reverse;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `
  ]
})
export class ChatRoomPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  chatId: string | null = null;
  newMessageText = '';
  isDetailsExpanded = true;

  messages: Message[] = [];

  readonly quickActions: QuickAction[] = [
    { id: 'share-venue', icon: '📍', label: 'Share Venue', color: '#EFF6FF' },
    { id: 'invite-game', icon: '⚽', label: 'Invite to Game', color: '#F0FDF4' },
    { id: 'schedule', icon: '📅', label: 'Schedule Match', color: '#FFF7ED' },
    { id: 'photo', icon: '📷', label: 'Send Photo', color: '#F5F3FF' },
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.chatId = params.get('id');
      this.loadChatMessages();
    });
  }

  loadChatMessages() {
    // Loaded to exactly match screenshots
    this.messages = [
      { 
        id: 1, 
        sender: 'Vikram Singh', 
        avatar: '👨', 
        text: "Guys, everyone's confirmed right? I've booked the courts.", 
        time: '7:45 PM', 
        reactions: '👍 4' 
      },
      { 
        id: 2, 
        sender: 'Priya V', 
        avatar: '👩‍🦰', 
        text: "Yes! I'll be there at 6:45.", 
        time: '7:48 PM' 
      }
    ];
  }

  back() {
    this.router.navigateByUrl('/app/chat');
  }

  callGroup() {
    alert('Calling group match host...');
  }

  showInfo() {
    alert('Match rules and details info sheet');
  }

  onQuickAction(action: QuickAction) {
    this.actionClick(action.label);
  }

  actionClick(action: string) {
    alert(`Trigger action: ${action}`);
  }

  sendMessage() {
    if (!this.newMessageText.trim()) return;

    this.messages.push({
      id: Date.now(),
      sender: 'You',
      avatar: '👤',
      text: this.newMessageText,
      time: 'Just now',
      isSelf: true
    });

    const reply = this.newMessageText;
    this.newMessageText = '';

    // Simulate reactive responses
    setTimeout(() => {
      if (reply.toLowerCase().includes('hello') || reply.toLowerCase().includes('yes')) {
        this.messages.push({
          id: Date.now() + 1,
          sender: 'Vikram Singh',
          avatar: '👨',
          text: 'Awesome, see you soon!',
          time: 'Just now'
        });
      }
    }, 1000);
  }
}
