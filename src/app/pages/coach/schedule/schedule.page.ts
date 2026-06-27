import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface Session {
  id: number;
  time: string;
  team: string;
  type: string;
  venue: string;
  attendees: string;
}
interface DayGroup {
  id: number;
  date: string;
  sessions: Session[];
}

@Component({
  selector: 'app-coach-schedule-page',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
})
export class CoachSchedulePage {
  private readonly router = inject(Router);
  selectedFilter = 'all';

  readonly filters = ['all', 'training', 'match', 'evaluation'];

  readonly schedule: DayGroup[] = [
    {
      id: 1,
      date: 'Today',
      sessions: [
        {
          id: 1,
          time: '4:00 PM – 6:00 PM',
          team: 'Elite Football Squad',
          type: 'Training',
          venue: 'Phoenix Arena',
          attendees: '10/11',
        },
      ],
    },
    {
      id: 2,
      date: 'Tomorrow',
      sessions: [
        {
          id: 2,
          time: '6:00 AM – 8:00 AM',
          team: 'Junior Cricket Team',
          type: 'Match Prep',
          venue: 'Green Park Stadium',
          attendees: '18/22',
        },
        {
          id: 3,
          time: '5:00 PM – 7:00 PM',
          team: 'Basketball Academy',
          type: 'Scrimmage',
          venue: 'City Sports Complex',
          attendees: '8/10',
        },
      ],
    },
    {
      id: 3,
      date: 'April 25',
      sessions: [
        {
          id: 4,
          time: '3:00 PM – 4:00 PM',
          team: 'Elite Football Squad',
          type: 'Evaluation',
          venue: 'Phoenix Arena',
          attendees: '11/11',
        },
      ],
    },
  ];

  getFilteredSessions(sessions: Session[]): Session[] {
    if (this.selectedFilter === 'all') return sessions;
    return sessions.filter(
      (s) =>
        s.type.toLowerCase().includes(this.selectedFilter.toLowerCase()) ||
        (this.selectedFilter === 'match' &&
          s.type.toLowerCase().includes('scrimmage'))
    );
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      Training: 'type-training',
      'Match Prep': 'type-match',
      Scrimmage: 'type-scrimmage',
      Evaluation: 'type-eval',
      Fitness: 'type-fitness',
      Tactical: 'type-tactical',
    };
    return map[type] ?? 'type-default';
  }

  openSession(session: Session | null) {
    this.router.navigate(['/app/coach/plan']);
  }

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
