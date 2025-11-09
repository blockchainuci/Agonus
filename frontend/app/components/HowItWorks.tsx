import Steps from './ui/steps';
import { spacing, typography, layout } from '../design-tokens';
export default function HowItWorks() {
  return (
    <section className={`${spacing.section.x} ${spacing.section.y} relative`}>
      <div className={`${layout.container['2xl']} mx-auto`}>
        <div className="text-center mb-20">
          <h2 className={`${typography.h2} text-white ${spacing.titleGap}`}>
            How It Works
          </h2>
          <p
            className={`${typography.body.lg} text-gray-300 max-w-3xl mx-auto`}
          >
            Four simple steps to start winning with AI
          </p>
        </div>
        <Steps />
      </div>
    </section>
  );
}
