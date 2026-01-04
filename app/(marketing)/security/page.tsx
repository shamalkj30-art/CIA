import { Page, Section, Card, Grid, Badge } from '@/components/ui'

export const metadata = {
  title: 'Security - Cyncro',
  description: 'Learn how Cyncro protects your receipt data and personal information.',
}

export default function SecurityPage() {
  return (
    <>
      <Section spacing="normal">
        <Page size="narrow">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">Security</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Your data is protected
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              We take security seriously. Here&apos;s how we keep your information safe.
            </p>
          </div>
        </Page>
      </Section>

      <Section spacing="normal" bg="surface">
        <Page>
          <Grid cols={2} gap="lg">
            {[
              {
                icon: '🔐',
                title: 'Encryption at Rest',
                desc: 'All data is encrypted using AES-256 encryption when stored in our databases. Your receipts and personal information are never stored in plain text.',
              },
              {
                icon: '🔒',
                title: 'Encryption in Transit',
                desc: 'All connections to Cyncro use TLS 1.3 encryption. Your data is protected as it travels between your device and our servers.',
              },
              {
                icon: '🏢',
                title: 'Secure Infrastructure',
                desc: 'We use industry-leading cloud providers with SOC 2 Type II certification. Our infrastructure is regularly audited for security compliance.',
              },
              {
                icon: '🔑',
                title: 'Secure Authentication',
                desc: 'We use Supabase Auth with industry-standard security practices. Passwords are hashed using bcrypt and never stored in plain text.',
              },
              {
                icon: '🤖',
                title: 'AI Privacy',
                desc: 'Our AI processing happens securely and we never train on your personal data. Your receipts are only analyzed to extract information for you.',
              },
              {
                icon: '🗑️',
                title: 'Data Deletion',
                desc: 'You can export or delete your data at any time. When you delete your account, all your data is permanently removed within 30 days.',
              },
            ].map((item) => (
              <Card key={item.title} padding="lg">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </Card>
            ))}
          </Grid>
        </Page>
      </Section>

      <Section spacing="normal">
        <Page size="narrow">
          <Card padding="lg" className="text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Have security questions?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              If you have questions about our security practices or want to report a vulnerability,
              please reach out to our security team.
            </p>
            <a
              href="mailto:security@cyncro.app"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              security@cyncro.app
            </a>
          </Card>
        </Page>
      </Section>
    </>
  )
}
