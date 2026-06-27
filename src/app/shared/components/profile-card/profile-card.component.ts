import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  template: `
    <article class="rounded-[20px] border border-white/10 bg-card p-5 text-center">
      <div class="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-5xl">
        {{ avatar }}
      </div>
      <h2 class="text-2xl font-bold text-white">{{ name }}</h2>
      <p class="mt-1 text-sm text-slate-400">{{ meta }}</p>
      <ng-content></ng-content>
    </article>
  `,
})
export class ProfileCardComponent {
  @Input() name = '';
  @Input() avatar = '';
  @Input() meta = '';
}
