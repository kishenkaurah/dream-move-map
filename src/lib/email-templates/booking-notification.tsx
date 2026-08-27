import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

/**
 * Internal owner notification sent immediately after a consultation booking or
 * country-expert request is saved. Recipient is OWNER_NOTIFICATION_EMAIL.
 */
export interface BookingNotificationProps {
  requestType?: string
  country?: string
  offerName?: string
  offerSlug?: string
  name?: string
  email?: string
  timezone?: string
  preferredTimes?: string
  helpWith?: string | null
  status?: string
  providerName?: string
  price?: string
  bookingId?: string
}

const INK = '#151e32'
const MUTED = '#6b7280'

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <Text style={row}>
      <span style={labelStyle}>{label}: </span>
      {value}
    </Text>
  ) : null

const Email = (props: BookingNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${props.requestType ?? 'New request'} — ${props.country ?? ''} — ${props.name ?? ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{props.requestType ?? 'New request'}</Heading>
        <Text style={sub}>Respond promptly — this person is waiting on you.</Text>
        <Section>
          <Row label="Country" value={props.country} />
          <Row label="Offer" value={props.offerName} />
          <Row label="Offer slug" value={props.offerSlug} />
          <Row label="Status" value={props.status} />
          <Row label="Provider" value={props.providerName} />
          <Row label="Price" value={props.price} />
        </Section>
        <Section>
          <Row label="Name" value={props.name} />
          <Row label="Email" value={props.email} />
          <Row label="Timezone" value={props.timezone} />
          <Row label="Preferred windows" value={props.preferredTimes} />
          <Row label="Wants help with" value={props.helpWith ?? undefined} />
        </Section>
        <Text style={idLine}>Request ID: {props.bookingId}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `${data['subjectPrefix'] ?? 'New Retire Abroad request'}: ${data['country'] ?? ''}`.trim(),
  displayName: 'Owner booking notification',
  previewData: {
    subjectPrefix: 'New Retire Abroad booking',
    requestType: 'Thailand planning call',
    country: 'Thailand',
    offerName: 'Thailand Retirement Planning Call',
    offerSlug: 'thailand-planning-call',
    name: 'Jane Doe',
    email: 'jane@example.com',
    timezone: 'Europe/London',
    preferredTimes: 'Weekday mornings',
    helpWith: 'Visa options and budget sanity check',
    status: 'interest',
    providerName: 'the founder of Retire Abroad Navigator',
    price: 'US$149',
    bookingId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { color: INK, fontSize: '20px', margin: '0 0 4px' }
const sub = { color: MUTED, fontSize: '14px', margin: '0 0 16px' }
const row = { color: INK, fontSize: '14px', margin: '0 0 6px' }
const labelStyle = { color: MUTED }
const idLine = { color: MUTED, fontSize: '12px', marginTop: '16px' }

export default Email
