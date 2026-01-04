import examples from './examples.json'
import pricing from './pricing.json'
import features from './features.json'

export { examples, pricing, features }

// Type exports for content
export type Example = typeof examples.examples[number]
export type Category = typeof examples.categories[number]
export type Plan = typeof pricing.plans[number]
export type FAQ = typeof pricing.faqs[number]
