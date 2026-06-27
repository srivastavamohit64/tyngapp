import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EventGame } from '../../models/app.models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./event-card.component.scss'],
  templateUrl: './event-card.component.html',
})
export class EventCardComponent {
  @Input() event?: EventGame;
  @Output() open = new EventEmitter<EventGame | undefined>();
}
