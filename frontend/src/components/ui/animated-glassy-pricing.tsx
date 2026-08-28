import React from 'react';
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
// --- Internal Helper Components (Not exported) --- //

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// --- EXPORTED Building Blocks --- //

/**
 * We export the Props interface so you can easily type the data for your plans.
 */
export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
}

/**
 * We export the PricingCard component itself in case you want to use it elsewhere.
 */
export const PricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary', onClick
}: PricingCardProps) => {
  const cardClasses = `
    rounded-2xl shadow-xl flex-1 max-w-xs px-7 py-8 flex flex-col transition-all duration-300
    bg-surface border border-brand/15
    ${isPopular 
      ? 'scale-105 relative border border-brand/50 shadow-[0_0_30px_color-mix(in_oklab,var(--brand)_10%,transparent)]' 
      : ''
    }
  `;
  const buttonClasses = `
    mt-auto w-full py-2.5 rounded-xl font-semibold text-[14px] transition font-sans
    ${buttonVariant === 'primary' 
      ? 'bg-brand text-brand-ink hover:bg-brand-deep border-none' 
      : 'bg-transparent text-brand border border-brand/40 hover:bg-brand/10'
    }
  `;

  return (
    <div className={cardClasses.trim()}>
      {isPopular && (
        <div className="absolute -top-4 right-4 px-3 py-1 text-[12px] font-semibold rounded-full bg-brand text-brand-ink">
          Most Popular
        </div>
      )}
      <div className="mb-3">
        <h2 className="text-[48px] font-extralight tracking-[-0.03em] text-ink font-display">{planName}</h2>
        <p className="text-[16px] text-ink-muted mt-1 font-sans">{description}</p>
      </div>
      <div className="my-6 flex items-baseline gap-2">
        <span className="text-[48px] font-bold text-ink font-display">${price}</span>
        <span className="text-[14px] text-ink-muted font-sans">/mo</span>
      </div>
      <div className="card-divider w-full mb-5 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--brand)_15%,transparent)_50%,transparent)]"></div>
      <ul className="flex flex-col gap-2 text-[14px] text-ink-muted mb-6 font-sans">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckIcon className="text-brand w-4 h-4" /> {feature}
          </li>
        ))}
      </ul>
      <RippleButton className={buttonClasses.trim()} onClick={onClick}>{buttonText}</RippleButton>
    </div>
  );
};


// --- EXPORTED Customizable Page Component --- //

interface ModernPricingPageProps {
  /** The main title. Can be a string or a ReactNode for more complex content. */
  title: React.ReactNode;
  /** The subtitle text appearing below the main title. */
  subtitle: React.ReactNode;
  /** An array of plan objects that conform to PricingCardProps. */
  plans: PricingCardProps[];
  /** Whether to show the animated WebGL background. Defaults to true. */
  showAnimatedBackground?: boolean;
}

export const ModernPricingPage = ({
  title,
  subtitle,
  plans,
  showAnimatedBackground = false,
}: ModernPricingPageProps) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      <div className="absolute inset-0 -z-10" style={{
        background: 'radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--brand) 15%, transparent) 0%, transparent 60%)'
      }}></div>
      <main className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-5xl mx-auto text-center mb-14 px-4 sm:px-0">
          <h1 className="text-[48px] md:text-[64px] font-extralight leading-tight tracking-[-0.03em] text-ink font-display">
            {title}
          </h1>
          <p className="mt-3 text-[16px] md:text-[20px] text-ink-muted max-w-2xl mx-auto font-sans">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center items-center w-full max-w-4xl">
          {plans.map((plan) => <PricingCard key={plan.planName} {...plan} />)}
        </div>
      </main>
    </div>
  );
};
