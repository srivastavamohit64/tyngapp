import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-facilities-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./facilities.page.scss'],
  templateUrl: './facilities.page.html',
})
export class VenueFacilitiesPage {
  private readonly router = inject(Router);

  readonly facilities = [
    {
      id: 1,
      name: 'Court 1',
      type: 'Football',
      status: 'active',
      capacity: 22,
      price: '₹1,500/hr',
      nextMaintenance: 'May 5, 2026',
    },
    {
      id: 2,
      name: 'Court 2',
      type: 'Basketball',
      status: 'active',
      capacity: 10,
      price: '₹1,200/hr',
      nextMaintenance: 'May 10, 2026',
    },
    {
      id: 3,
      name: 'Main Ground',
      type: 'Cricket',
      status: 'maintenance',
      capacity: 44,
      price: '₹2,000/hr',
      nextMaintenance: 'Tomorrow',
    },
  ];

  readonly amenities = [
    { id: 1, name: 'Changing Rooms', status: 'working' },
    { id: 2, name: 'Showers', status: 'working' },
    { id: 3, name: 'Parking', status: 'working' },
    { id: 4, name: 'Lighting', status: 'issue' },
  ];

  goBack() {
    this.router.navigateByUrl('/app/profile');
  }
}
