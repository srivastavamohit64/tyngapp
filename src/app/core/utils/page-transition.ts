import { createAnimation } from '@ionic/angular';
import type { Animation } from '@ionic/angular';

interface PageTransitionOptions {
  enteringEl: HTMLElement;
  leavingEl?: HTMLElement;
  direction?: 'forward' | 'back' | string;
}

const DURATION_MS = 160;
const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const OFFSET = '18px';

/**
 * Only the top page moves; the page underneath stays opaque and still, so two
 * half-transparent pages never overlap. Ionic stacks the entering page above
 * the leaving one going forward and below it going back.
 */
export function appPageTransition(_baseEl: HTMLElement, opts: PageTransitionOptions): Animation {
  const back = opts.direction === 'back';
  const root = createAnimation().duration(DURATION_MS).easing(EASING);

  const entering = createAnimation()
    .addElement(opts.enteringEl)
    .beforeRemoveClass('ion-page-invisible')
    .beforeClearStyles(['opacity']);

  if (!back) {
    entering
      .fromTo('opacity', '0', '1')
      .fromTo('transform', `translate3d(${OFFSET}, 0, 0)`, 'translate3d(0, 0, 0)');
  }
  root.addAnimation(entering);

  if (opts.leavingEl) {
    const leaving = createAnimation().addElement(opts.leavingEl);
    if (back) {
      const leavingEl = opts.leavingEl;
      leaving
        .fromTo('opacity', '1', '0')
        .fromTo('transform', 'translate3d(0, 0, 0)', `translate3d(${OFFSET}, 0, 0)`)
        // Ionic removes the popped page a moment after the animation ends; keep it hidden until then.
        .onFinish((currentStep: 0 | 1) => {
          if (currentStep === 1) {
            leavingEl.style.opacity = '0';
          }
        });
    }
    root.addAnimation(leaving);
  }

  return root;
}
