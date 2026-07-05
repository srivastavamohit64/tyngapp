import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-coach-create-session',
  standalone: true,
  template: ''
})
export class CoachCreateSessionPage implements OnInit {
  private readonly router = inject(Router);

  ngOnInit() {
    this.router.navigateByUrl('/app/coach/plan', { replaceUrl: true });
  }
}
