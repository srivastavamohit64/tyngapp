import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-venues-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  styleUrls: ['./venues.page.scss'],
  templateUrl: './venues.page.html',
})
export class VenuesPage {
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);

  async openMenu() {
    await this.menu.open();
  }

  selectedSlotIndex: number | null = null;

  readonly amenities = [
    { name: 'Free WiFi', icon: 'wifi-outline' },
    { name: 'Parking', icon: 'car-outline' },
    { name: 'Shower', icon: 'water-outline' },
    { name: 'Pro Equipment', icon: 'ribbon-outline' },
  ];

  readonly offers = [
    '10% off on first booking',
    'Free energy drink with booking',
  ];

  readonly slots = [
    { time: '6:00 AM - 7:00 AM', price: '₹1200', booked: false },
    { time: '7:00 AM - 8:00 AM', price: '₹1500', booked: false },
    { time: '6:00 PM - 7:00 PM', price: '₹2000', booked: true },
    { time: '7:00 PM - 8:00 PM', price: '₹2000', booked: false },
    { time: '8:00 PM - 9:00 PM', price: '₹1800', booked: false },
  ];

  selectSlot(index: number) {
    if (!this.slots[index].booked) {
      this.selectedSlotIndex = this.selectedSlotIndex === index ? null : index;
    }
  }

  proceed() {
    if (this.selectedSlotIndex !== null) {
      void this.router.navigateByUrl('/app/venue/3/book');
    }
  }

  goBack() {
    void this.router.navigateByUrl('/app/home');
  }
}
