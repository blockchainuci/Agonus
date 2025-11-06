'use client';

import Steps from './ui/steps';
import {spacing, typography, layout} from '../design-tokens';
export default function HowItWorks() {
  return (
     <section className={`${spacing.section.all} ${spacing.sectionGap}`}>
      <div className={`${layout.container.lg} mx-auto`}>
        <h2 className={`${typography.h2} text-white ${spacing.titleGap}`}>
          How it Works
        </h2>
        <Steps />
      </div>
    </section>
  );
}
