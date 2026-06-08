import { ModernPricingPage, PricingCardProps  } from "@/components/ui/animated-glassy-pricing";

const myPricingPlans: PricingCardProps[] = [
  { 
    planName: 'Free', 
    description: 'Perfect for exploring the neural core.', 
    price: '0', 
    features: ['500 requests/day', '100 analyses/month', 'Web dashboard'], 
    buttonText: 'Get Started', 
    buttonVariant: 'secondary'
  },
  { 
    planName: 'Pro', 
    description: 'For developers and audio professionals.', 
    price: '4.99', 
    features: ['10,000 requests/day', '1,000 analyses/month', 'API access'], 
    buttonText: 'Choose Pro Plan', 
    isPopular: true, 
    buttonVariant: 'primary' 
  },
  { 
    planName: 'Enterprise', 
    description: 'Unlimited scale with SLA guarantees.', 
    price: '19.99', 
    features: ['Unlimited analyses', 'Priority support', '20 API keys'], 
    buttonText: 'Contact Us', 
    buttonVariant: 'primary' 
  },
];

const PricingDemo = () => {
  return <ModernPricingPage
        title={
          <>
            Find the <span className="text-secondary">Perfect Plan</span> for Your Business
          </>
        }
        subtitle="Start for free, then grow with us. Flexible plans for projects of all sizes."
        plans={myPricingPlans}
        showAnimatedBackground={true}
      />
;
};

export default PricingDemo;
