import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

export interface Court {
  id: string;
  courtName: string;
  venueName: string;
  sport: string;
  image: string;
  distance: number;
  rating: number;
  ratingCount: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  hasRentalGear: boolean;
  gamesPlayed: number;
  isIndoor: boolean;
  isOpenNow: boolean;
  venueDetailId: number;
}

const COURTS: Court[] = [
  { id:'kd-bball-1',   courtName:'Basketball Court 1',          venueName:'KD Singh Babu Stadium',         sport:'basketball', image:'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=700&h=420&fit=crop&auto=format',        distance:2.3, rating:4.6, ratingCount:48,  pricePerHour:800,  openTime:'6:00 AM', closeTime:'10:00 PM', amenities:['parking','lights','washrooms','water'],              hasRentalGear:true,  gamesPlayed:234, isIndoor:true,  isOpenNow:true,  venueDetailId:2 },
  { id:'kd-bball-2',   courtName:'Basketball Court 2',          venueName:'KD Singh Babu Stadium',         sport:'basketball', image:'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=700&h=420&fit=crop&auto=format',       distance:2.3, rating:4.4, ratingCount:31,  pricePerHour:700,  openTime:'7:00 AM', closeTime:'9:00 PM',  amenities:['lights','washrooms'],                                hasRentalGear:false, gamesPlayed:189, isIndoor:true,  isOpenNow:true,  venueDetailId:2 },
  { id:'kd-tennis-1',  courtName:'Tennis Court 1',              venueName:'KD Singh Babu Stadium',         sport:'tennis',     image:'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=700&h=420&fit=crop&auto=format',         distance:2.3, rating:4.7, ratingCount:62,  pricePerHour:1000, openTime:'6:00 AM', closeTime:'9:00 PM',  amenities:['parking','washrooms','water'],                       hasRentalGear:true,  gamesPlayed:312, isIndoor:false, isOpenNow:true,  venueDetailId:2 },
  { id:'kd-football',  courtName:'Football Ground',             venueName:'KD Singh Babu Stadium',         sport:'football',   image:'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=420&fit=crop&auto=format',           distance:2.3, rating:4.5, ratingCount:73,  pricePerHour:1200, openTime:'6:00 AM', closeTime:'8:00 PM',  amenities:['parking','lights','washrooms'],                      hasRentalGear:false, gamesPlayed:298, isIndoor:false, isOpenNow:false, venueDetailId:2 },
  { id:'sac-badm-1',   courtName:'Badminton Court 1',           venueName:'Sports Authority Complex',      sport:'badminton',  image:'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=420&fit=crop&auto=format',          distance:3.8, rating:4.8, ratingCount:89,  pricePerHour:500,  openTime:'5:30 AM', closeTime:'10:30 PM',amenities:['parking','lights','washrooms','water','cafeteria'], hasRentalGear:true,  gamesPlayed:567, isIndoor:true,  isOpenNow:true,  venueDetailId:3 },
  { id:'sac-badm-2',   courtName:'Badminton Court 2',           venueName:'Sports Authority Complex',      sport:'badminton',  image:'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=420&fit=crop&auto=format',          distance:3.8, rating:4.7, ratingCount:74,  pricePerHour:500,  openTime:'5:30 AM', closeTime:'10:30 PM',amenities:['lights','washrooms'],                                hasRentalGear:false, gamesPlayed:445, isIndoor:true,  isOpenNow:true,  venueDetailId:3 },
  { id:'sac-bball',    courtName:'Basketball Court',            venueName:'Sports Authority Complex',      sport:'basketball', image:'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=700&h=420&fit=crop&auto=format',        distance:3.8, rating:4.5, ratingCount:55,  pricePerHour:900,  openTime:'6:00 AM', closeTime:'9:00 PM',  amenities:['parking','lights','washrooms'],                      hasRentalGear:true,  gamesPlayed:198, isIndoor:true,  isOpenNow:true,  venueDetailId:3 },
  { id:'sac-volleyball',courtName:'Volleyball Court',           venueName:'Sports Authority Complex',      sport:'volleyball', image:'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=700&h=420&fit=crop&auto=format',         distance:3.8, rating:4.3, ratingCount:28,  pricePerHour:600,  openTime:'7:00 AM', closeTime:'8:00 PM',  amenities:['lights','washrooms'],                                hasRentalGear:false, gamesPlayed:156, isIndoor:false, isOpenNow:false, venueDetailId:3 },
  { id:'phoenix-ten-1',courtName:'Tennis Court 1 — Clay',      venueName:'Phoenix Sports Hub',            sport:'tennis',     image:'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=700&h=420&fit=crop&auto=format',         distance:5.2, rating:4.9, ratingCount:112, pricePerHour:1200, openTime:'6:00 AM', closeTime:'10:00 PM',amenities:['parking','lights','washrooms','water','cafeteria'], hasRentalGear:true,  gamesPlayed:423, isIndoor:false, isOpenNow:true,  venueDetailId:2 },
  { id:'phoenix-ten-2',courtName:'Tennis Court 2 — Hard',      venueName:'Phoenix Sports Hub',            sport:'tennis',     image:'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=700&h=420&fit=crop&auto=format',           distance:5.2, rating:4.8, ratingCount:88,  pricePerHour:1100, openTime:'7:00 AM', closeTime:'9:00 PM',  amenities:['lights','washrooms'],                                hasRentalGear:false, gamesPlayed:356, isIndoor:false, isOpenNow:true,  venueDetailId:2 },
  { id:'ekana-1',      courtName:'Cricket Ground 1 — Main',    venueName:'BRSABV Ekana Cricket Stadium',  sport:'cricket',    image:'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=420&fit=crop&auto=format',          distance:4.5, rating:4.8, ratingCount:128, pricePerHour:2500, openTime:'6:00 AM', closeTime:'10:00 PM',amenities:['parking','lights','washrooms','water','cafeteria','changing'], hasRentalGear:true, gamesPlayed:689, isIndoor:false, isOpenNow:true, venueDetailId:1 },
  { id:'ekana-2',      courtName:'Cricket Ground 2 — Practice',venueName:'BRSABV Ekana Cricket Stadium',  sport:'cricket',    image:'https://images.unsplash.com/photo-1595210382266-2d0077c1f541?w=700&h=420&fit=crop&auto=format',          distance:4.5, rating:4.5, ratingCount:67,  pricePerHour:1800, openTime:'5:00 AM', closeTime:'10:00 PM',amenities:['lights','washrooms','water'],                        hasRentalGear:true,  gamesPlayed:445, isIndoor:false, isOpenNow:true, venueDetailId:1 },
];

@Component({
  selector: 'app-venues-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  styleUrls: ['./venues.page.scss'],
  templateUrl: './venues.page.html',
})
export class VenuesPage {
  private readonly router = inject(Router);

  city = signal('Lucknow');
  showCityPicker = signal(false);
  searchQuery = signal('');
  activeSport = signal('all');
  activeFilters = signal<string[]>([]);

  readonly cities = ['Lucknow', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

  readonly sports = [
    { id: 'all',         label: 'All Sports',   image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop&auto=format' },
    { id: 'basketball',  label: 'Basketball',   image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=120&h=120&fit=crop&auto=format' },
    { id: 'football',    label: 'Football',     image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=120&h=120&fit=crop&auto=format' },
    { id: 'cricket',     label: 'Cricket',      image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=120&h=120&fit=crop&auto=format' },
    { id: 'tennis',      label: 'Tennis',       image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=120&h=120&fit=crop&auto=format' },
    { id: 'badminton',   label: 'Badminton',    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=120&h=120&fit=crop&auto=format' },
    { id: 'volleyball',  label: 'Volleyball',   image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=120&h=120&fit=crop&auto=format' },
    { id: 'swimming',    label: 'Swimming',     image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=120&h=120&fit=crop&auto=format' },
    { id: 'tabletennis', label: 'Table Tennis', image: 'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=120&h=120&fit=crop&auto=format' },
    { id: 'pickleball',  label: 'Pickleball',   image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=120&h=120&fit=crop&auto=format' },
  ];

  readonly filterChips = [
    { id: 'indoor',    label: '🏢 Indoor'      },
    { id: 'outdoor',   label: '🌿 Outdoor'     },
    { id: 'morning',   label: '🌅 Morning'     },
    { id: 'evening',   label: '🌇 Evening'     },
    { id: 'rental',    label: '🎽 Rental Gear' },
    { id: 'open',      label: '🟢 Open Now'   },
    { id: 'price',     label: '💰 Price'       },
    { id: 'rating',    label: '⭐ Rating'      },
  ];

  readonly amenityMap: Record<string, { icon: string; label: string }> = {
    parking:  { icon: 'car-outline',       label: 'Parking'  },
    lights:   { icon: 'flash-outline',     label: 'Lights'   },
    washrooms:{ icon: 'water-outline',     label: 'WC'       },
    water:    { icon: 'water-outline',     label: 'Water'    },
    cafeteria:{ icon: 'cafe-outline',      label: 'Café'     },
    changing: { icon: 'shirt-outline',     label: 'Changing' },
  };

  filteredCourts = computed(() => {
    let result = [...COURTS];
    const sport = this.activeSport();
    const query = this.searchQuery().trim().toLowerCase();
    const activeFlts = this.activeFilters();

    if (sport !== 'all') {
      result = result.filter(c => c.sport === sport);
    }
    if (query) {
      result = result.filter(c =>
        c.courtName.toLowerCase().includes(query) ||
        c.venueName.toLowerCase().includes(query)
      );
    }
    if (activeFlts.includes('indoor')) {
      result = result.filter(c => c.isIndoor);
    }
    if (activeFlts.includes('outdoor')) {
      result = result.filter(c => !c.isIndoor);
    }
    if (activeFlts.includes('open')) {
      result = result.filter(c => c.isOpenNow);
    }
    if (activeFlts.includes('rental')) {
      result = result.filter(c => c.hasRentalGear);
    }
    if (activeFlts.includes('morning')) {
      result = result.filter(c => parseInt(c.openTime) < 12);
    }
    if (activeFlts.includes('evening')) {
      result = result.filter(c => parseInt(c.openTime) >= 16 || c.closeTime.includes('PM'));
    }
    if (activeFlts.includes('price')) {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    }
    if (activeFlts.includes('rating')) {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  });

  toggleFilter(id: string) {
    this.activeFilters.update(f =>
      f.includes(id) ? f.filter(x => x !== id) : [...f, id]
    );
  }

  selectCity(c: string) {
    this.city.set(c);
    this.showCityPicker.set(false);
  }

  bookNow(court: Court) {
    void this.router.navigateByUrl(`/app/venue/${court.venueDetailId}`);
  }

  resetAll() {
    this.activeSport.set('all');
    this.activeFilters.set([]);
    this.searchQuery.set('');
  }
}
