import Link from 'next/link'
import { Page, Section, Card, Badge, Button } from '@/components/ui'

export const metadata = {
  title: 'Pricing - Cyncro',
  description: 'Simple, transparent pricing for warranty tracking. Start free, upgrade when you need more.',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 25 receipts',
      'Basic warranty tracking',
      'Claim packet generation',
      'Email support',
    ],
    cta: 'Get started',
    ctaVariant: 'secondary' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$5',
    period: 'per month',
    description: 'For homeowners & families',
    features: [
      'Unlimited receipts',
      'Priority AI processing',
      'Email forwarding inbox',
      'Expiry alerts & reminders',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Start free trial',
    ctaVariant: 'primary' as const,
    popular: true,
  },
]

const faqs = [
  {
    q: 'Can I try Pro for free?',
    a: 'Yes! Pro comes with a 14-day free trial. No credit card required.',
  },
  {
    q: 'What happens when I reach 25 receipts on Free?',
    a: 'You can still view and manage your existing receipts. You just won\'t be able to add new ones until you upgrade or delete some.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. You can cancel your subscription at any time. You\'ll keep access until the end of your billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'If you\'re not satisfied within the first 30 days, we\'ll give you a full refund. No questions asked.',
  },
]

export default function PricingPage() {
  return (
    <>
      <Section spacing="normal">
        <Page>
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">Pricing</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                padding="lg"
                className={plan.popular ? 'border-2 border-[var(--primary)] relative' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                    <span className="text-[var(--text-muted)] ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button as="link" href="/signup" variant={plan.ctaVariant} fullWidth size="lg">
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </Page>
      </Section>

      <Section spacing="normal" bg="surface">
        <Page size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} variant="outline" padding="md">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{faq.q}</h3>
                <p className="text-[var(--text-secondary)]">{faq.a}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-[var(--text-muted)]">
              Have more questions?{' '}
              <Link href="mailto:support@cyncro.app" className="text-[var(--primary)] hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        </Page>
      </Section>
    </>
  )
}
