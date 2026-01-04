'use client'

import { useState } from 'react'
import { Page, Section, Card, Badge, Button, Chip, ChipGroup, Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from '@/components/ui'

const categories = ['All', 'Electronics', 'Appliances', 'Clothing', 'Home', 'Auto']

const examples = [
  {
    id: 1,
    category: 'Electronics',
    merchant: 'Apple Store',
    item: 'MacBook Pro 14"',
    price: '$1,999',
    warranty: '12 months',
    date: '2024-12-15',
    confidence: 98,
    image: '/examples/macbook.jpg',
  },
  {
    id: 2,
    category: 'Electronics',
    merchant: 'Best Buy',
    item: 'Sony WH-1000XM5',
    price: '$349',
    warranty: '12 months',
    date: '2024-11-20',
    confidence: 95,
    image: '/examples/sony.jpg',
  },
  {
    id: 3,
    category: 'Appliances',
    merchant: 'Home Depot',
    item: 'LG Refrigerator',
    price: '$1,299',
    warranty: '24 months',
    date: '2024-10-05',
    confidence: 92,
    image: '/examples/fridge.jpg',
  },
  {
    id: 4,
    category: 'Clothing',
    merchant: 'Zara',
    item: 'Winter Jacket',
    price: '$149',
    warranty: '0 months',
    date: '2024-12-01',
    confidence: 88,
    returnDays: 30,
    image: '/examples/jacket.jpg',
  },
  {
    id: 5,
    category: 'Home',
    merchant: 'IKEA',
    item: 'MALM Dresser',
    price: '$199',
    warranty: '10 years',
    date: '2024-09-15',
    confidence: 91,
    image: '/examples/dresser.jpg',
  },
  {
    id: 6,
    category: 'Auto',
    merchant: 'AutoZone',
    item: 'Car Battery',
    price: '$189',
    warranty: '36 months',
    date: '2024-08-22',
    confidence: 94,
    image: '/examples/battery.jpg',
  },
]

export default function ExamplesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedExample, setSelectedExample] = useState<typeof examples[0] | null>(null)

  const filteredExamples = selectedCategory === 'All'
    ? examples
    : examples.filter((e) => e.category === selectedCategory)

  return (
    <>
      <Section spacing="normal">
        <Page>
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">Examples</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              See it in action
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Browse real examples of receipts processed by Cyncro. See how our AI extracts warranty information from different merchants and product categories.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center mb-10">
            <ChipGroup>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </ChipGroup>
          </div>

          {/* Examples Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExamples.map((example) => (
              <Card
                key={example.id}
                interactive
                onClick={() => setSelectedExample(example)}
                className="cursor-pointer"
              >
                {/* Placeholder Image */}
                <div className="aspect-[4/3] bg-[var(--surface-subtle)] rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{example.item}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{example.merchant}</p>
                  </div>
                  <Badge variant={example.confidence >= 90 ? 'success' : 'warning'} size="sm">
                    {example.confidence}%
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                  <span>{example.price}</span>
                  <span>•</span>
                  <span>{example.warranty === '0 months' ? 'No warranty' : example.warranty}</span>
                </div>
              </Card>
            ))}
          </div>
        </Page>
      </Section>

      {/* Example Detail Modal */}
      <Dialog
        open={!!selectedExample}
        onClose={() => setSelectedExample(null)}
        size="lg"
      >
        {selectedExample && (
          <>
            <DialogClose onClose={() => setSelectedExample(null)} />
            <DialogHeader>
              <DialogTitle>{selectedExample.item}</DialogTitle>
            </DialogHeader>
            <DialogContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Receipt Preview */}
                <div className="aspect-[3/4] bg-[var(--surface-subtle)] rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-[var(--text-muted)]">Receipt preview</p>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[var(--text-primary)]">Extracted Details</h4>
                    <Badge variant={selectedExample.confidence >= 90 ? 'success' : 'warning'}>
                      {selectedExample.confidence}% confidence
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Merchant', value: selectedExample.merchant },
                      { label: 'Item', value: selectedExample.item },
                      { label: 'Price', value: selectedExample.price },
                      { label: 'Purchase Date', value: selectedExample.date },
                      { label: 'Warranty', value: selectedExample.warranty === '0 months' ? 'No warranty' : selectedExample.warranty },
                      ...(selectedExample.returnDays ? [{ label: 'Return Window', value: `${selectedExample.returnDays} days` }] : []),
                    ].map((field) => (
                      <div key={field.label} className="flex justify-between py-2 border-b border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">{field.label}</span>
                        <span className="font-medium text-[var(--text-primary)]">{field.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button as="link" href="/signup" fullWidth>
                      Try Cyncro free
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  )
}
