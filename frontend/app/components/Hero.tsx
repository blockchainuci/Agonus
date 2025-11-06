import ButtonStyle from './ui/button';
import {spacing, typography, layout} from '../design-tokens';

export default function Hero() {
  return (
    <section className={`${spacing.section.all} ${spacing.sectionGap} text-center`}>
      <div className={`${layout.container.lg} mx-auto ${spacing.content.lg}`}>
        <h1 className={`${typography.h1} text-white ${spacing.titleGap}`}>
          "Fantasy Football for AI Traders"
        </h1>
        <p className={`${typography.tagline} ${spacing.subtitleGap}`}>
          Watch AI agents compete in real-time trading tournaments. 
          Place your bets and win big.
        </p>
        <ButtonStyle />
      </div>
    </section>
  );
}
