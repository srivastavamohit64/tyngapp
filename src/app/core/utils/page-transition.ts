import { createAnimation } from '@ionic/angular';

/** Short fade/slide so stack pages feel like the same app, not a new screen. */
export function appPageTransition(_baseEl: HTMLElement, opts: { enteringEl: HTMLElement; leavingEl?: HTMLElement }) {
  const duration = 180;
  const root = createAnimation().duration(duration).easing('cubic-bezier(0.32, 0.72, 0, 1)');

  const enter = createAnimation()
    .addElement(opts.enteringEl)
    .fromTo('opacity', '0.4', '1')
    .fromTo('transform', 'translate3d(12px, 0, 0)', 'translate3d(0, 0, 0)');

  if (opts.leavingEl) {
    const leave = createAnimation()
      .addElement(opts.leavingEl)
      .fromTo('opacity', '1', '0.55')
      .fromTo('transform', 'translate3d(0, 0, 0)', 'translate3d(-8px, 0, 0)');
    root.addAnimation([enter, leave]);
  } else {
    root.addAnimation(enter);
  }

  return root;
}
