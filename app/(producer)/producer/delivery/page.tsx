'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const colors = [
  'border-green-700 bg-green-50 text-green-800',
  'border-yellow-700 bg-yellow-50 text-yellow-800',
  'border-blue-700 bg-blue-50 text-blue-800',
  'border-purple-700 bg-purple-50 text-purple-800',
  'border-orange-700 bg-orange-50 text-orange-800',
  'border-pink-700 bg-pink-50 text-pink-800',
  'border-red-700 bg-red-50 text-red-800',
]

type FulfillmentType = 'local_connect' | 'self_fulfilled'

type ScheduleItem = {
  delivery_day: string
  cutoff_day: string
  cutoff_time: string
}

export default function ProducerDeliveryPage() {
  const [customerId, setCustomerId] = useState('')
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>('local_connect')
  const [deliverySchedule, setDeliverySchedule] = useState<ScheduleItem[]>([])
  const [dropoffNotes, setDropoffNotes] = useState('')
  const [agreedToLcTerms, setAgreedToLcTerms] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const activeSchedule =
    fulfillmentType === 'local_connect'
      ? [
          {
            delivery_day: 'Monday',
            cutoff_day: 'Sunday',
            cutoff_time: '17:00',
          },
          {
            delivery_day: 'Thursday',
            cutoff_day: 'Wednesday',
            cutoff_time: '17:00',
          },
        ]
      : deliverySchedule

  useEffect(() => {
    loadDeliverySettings()
  }, [])

  async function loadDeliverySettings() {
    setLoading(true)
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setMessage('You must be signed in.')
      setLoading(false)
      return
    }

    const { data: membership, error: membershipError } = await supabase
      .from('customer_members')
      .select('customer_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .single()

    if (membershipError || !membership) {
      setMessage('Producer account could not be found.')
      setLoading(false)
      return
    }

    setCustomerId(membership.customer_id)

    const { data, error } = await supabase
      .from('producer_delivery')
      .select('*')
      .eq('customer_id', membership.customer_id)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setFulfillmentType(data.fulfillment_type || 'local_connect')
      setDropoffNotes(data.dropoff_notes || '')
      setAgreedToLcTerms(Boolean(data.agreed_to_lc_terms))

      if (Array.isArray(data.delivery_schedule)) {
        setDeliverySchedule(data.delivery_schedule)
      } else if (Array.isArray(data.delivery_days)) {
        setDeliverySchedule(
          data.delivery_days.map((day: string) => ({
            delivery_day: day,
            cutoff_day: 'Monday',
            cutoff_time: '14:00',
          }))
        )
      }
    }

    setLoading(false)
  }

  function toggleDeliveryDay(day: string) {
    setDeliverySchedule((current) => {
      const exists = current.some((item) => item.delivery_day === day)

      if (exists) {
        return current.filter((item) => item.delivery_day !== day)
      }

      return [
        ...current,
        {
          delivery_day: day,
          cutoff_day: previousDay(day),
          cutoff_time: '14:00',
        },
      ]
    })
  }

  function updateScheduleItem(
    deliveryDay: string,
    field: keyof ScheduleItem,
    value: string
  ) {
    setDeliverySchedule((current) =>
      current.map((item) =>
        item.delivery_day === deliveryDay ? { ...item, [field]: value } : item
      )
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (fulfillmentType === 'local_connect' && !agreedToLcTerms) {
      setMessage('You must agree to the Local Connect drop-off terms.')
      setSaving(false)
      return
    }

    if (fulfillmentType === 'self_fulfilled' && deliverySchedule.length === 0) {
      setMessage('Please select at least one delivery day.')
      setSaving(false)
      return
    }

    const scheduleToSave =
      fulfillmentType === 'local_connect' ? activeSchedule : deliverySchedule

    const { error } = await supabase.from('producer_delivery').upsert(
      {
        customer_id: customerId,
        fulfillment_type: fulfillmentType,
        delivery_days: scheduleToSave.map((item) => item.delivery_day),
        delivery_schedule: scheduleToSave,
        cutoff_time: null,
        lead_time_days: 0,
        dropoff_notes: dropoffNotes || null,
        agreed_to_lc_terms:
          fulfillmentType === 'local_connect' ? agreedToLcTerms : false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'customer_id',
      }
    )

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Delivery settings saved.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
        <div className="lc-card rounded-3xl p-6 text-sm text-lc-muted shadow-sm">
          Loading delivery settings...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lc-bg p-5 text-lc-ink md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="lc-card rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-lc-green">
            Producer Fulfillment
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Delivery Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-lc-muted">
            Set your delivery method, delivery days, and exact order cutoffs.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="grid gap-6 lg:grid-cols-[1fr_0.75fr]"
        >
          <div className="space-y-6">
            <section className="lc-card rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Fulfillment Method</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('local_connect')}
                  className={
                    fulfillmentType === 'local_connect'
                      ? 'rounded-3xl border border-lc-green bg-lc-green p-5 text-left text-white shadow-sm transition'
                      : 'rounded-3xl border border-lc-border bg-lc-bg p-5 text-left transition hover:border-lc-green hover:bg-white'
                  }
                >
                  <p className="text-sm font-black uppercase">
                    Fulfilled by Local Connect
                  </p>
                  <p className="mt-2 text-sm leading-6 opacity-80">
                    Orders are submitted Sunday and Wednesday by 5 PM. Producers
                    must deliver to the Local Connect warehouse Monday and
                    Thursday.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('self_fulfilled')}
                  className={
                    fulfillmentType === 'self_fulfilled'
                      ? 'rounded-3xl border border-lc-green bg-lc-green p-5 text-left text-white shadow-sm transition'
                      : 'rounded-3xl border border-lc-border bg-lc-bg p-5 text-left transition hover:border-lc-green hover:bg-white'
                  }
                >
                  <p className="text-sm font-black uppercase">
                    Self Fulfilled
                  </p>
                  <p className="mt-2 text-sm leading-6 opacity-80">
                    You deliver directly to buyers on selected days.
                  </p>
                </button>
              </div>
            </section>

            {fulfillmentType === 'local_connect' ? (
              <section className="lc-card rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-black">
                  Local Connect Drop-Off Terms
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {activeSchedule.map((item, index) => (
                    <ScheduleCard
                      key={item.delivery_day}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>

                <label className="mt-5 flex items-start gap-3 rounded-3xl border border-lc-border bg-lc-bg p-4">
                  <input
                    type="checkbox"
                    checked={agreedToLcTerms}
                    onChange={(e) => setAgreedToLcTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-lc-green"
                  />

                  <span className="text-sm font-semibold leading-6 text-lc-ink">
                    I agree to deliver products to the Local Connect warehouse on
                    Monday and Thursday after orders are submitted Sunday and
                    Wednesday by 5 PM.
                  </span>
                </label>

                <Notes value={dropoffNotes} setValue={setDropoffNotes} />
              </section>
            ) : (
              <section className="lc-card rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-black">Delivery Days & Cutoffs</h2>

                <p className="mt-2 text-sm leading-6 text-lc-muted">
                  Select delivery days, then assign a cutoff day and cutoff time
                  for each one.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {weekDays.map((day) => {
                    const selected = deliverySchedule.some(
                      (item) => item.delivery_day === day
                    )

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDeliveryDay(day)}
                       className={
  selected
    ? 'min-w-fit whitespace-nowrap rounded-2xl border border-lc-green bg-lc-green px-5 py-3 text-sm font-black text-white transition'
    : 'min-w-fit whitespace-nowrap rounded-2xl border border-lc-border bg-lc-bg px-5 py-3 text-sm font-black text-lc-green transition hover:border-lc-green hover:bg-white'
}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-4">
                  {deliverySchedule.map((item, index) => (
                    <div
                      key={item.delivery_day}
                      className={`rounded-3xl border p-5 ${
                        colors[index % colors.length]
                      }`}
                    >
                      <p className="text-sm font-black uppercase">
                        {item.delivery_day} Delivery
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label>
                          <span className="mb-2 block text-xs font-black uppercase">
                            Cutoff Day
                          </span>
                          <select
                            value={item.cutoff_day}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.delivery_day,
                                'cutoff_day',
                                e.target.value
                              )
                            }
                            className="input rounded-2xl bg-white"
                          >
                            {weekDays.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span className="mb-2 block text-xs font-black uppercase">
                            Cutoff Time
                          </span>
                          <input
                            type="time"
                            value={item.cutoff_time}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.delivery_day,
                                'cutoff_time',
                                e.target.value
                              )
                            }
                            className="input rounded-2xl bg-white"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <Notes value={dropoffNotes} setValue={setDropoffNotes} />
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="lc-card sticky top-4 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-black">Calendar Preview</h2>

              <CalendarPreview schedule={activeSchedule} />

              <button
                type="submit"
                disabled={saving}
                className="lc-button-primary mt-6 w-full rounded-2xl text-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Delivery Settings'}
              </button>

              {message && (
                <p className="mt-4 rounded-2xl border border-lc-border bg-lc-bg p-3 text-sm font-semibold text-lc-muted">
                  {message}
                </p>
              )}
            </section>
          </aside>
        </form>
      </div>
    </main>
  )
}

function CalendarPreview({ schedule }: { schedule: ScheduleItem[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3">
      {weekDays.map((day) => {
        const events = schedule.flatMap((item, index) => {
          const color = colors[index % colors.length]
          const items = []

          if (item.cutoff_day === day) {
            items.push({
              label: `Cutoff for ${item.delivery_day}`,
              detail: formatTime(item.cutoff_time),
              color,
            })
          }

          if (item.delivery_day === day) {
            items.push({
              label: `${item.delivery_day} Delivery`,
              detail: 'Warehouse drop-off day',
              color,
            })
          }

          return items
        })

        return (
          <div
            key={day}
            className="rounded-2xl border border-lc-border bg-lc-bg p-4"
          >
            <p className="text-xs font-black uppercase tracking-wide text-lc-muted">
              {day}
            </p>

            <div className="mt-3 space-y-2">
              {events.length === 0 ? (
                <p className="text-xs text-lc-muted">No events</p>
              ) : (
                events.map((event, index) => (
                  <div
                    key={`${event.label}-${index}`}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${event.color}`}
                  >
                    <p>{event.label}</p>
                    <p className="mt-1 opacity-80">{event.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScheduleCard({ item, index }: { item: ScheduleItem; index: number }) {
  return (
    <div
      className={`rounded-3xl border p-5 ${colors[index % colors.length]}`}
    >
      <p className="text-sm font-black uppercase">
        {item.delivery_day} Delivery
      </p>
      <p className="mt-2 text-sm">
        Cutoff: {item.cutoff_day} at {formatTime(item.cutoff_time)}
      </p>
    </div>
  )
}

function Notes({
  value,
  setValue,
}: {
  value: string
  setValue: (value: string) => void
}) {
  return (
    <label className="mt-5 block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-lc-muted">
        Notes
      </span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Example: delivery area, minimum order, truck days, contact notes..."
        className="input rounded-2xl bg-white"
      />
    </label>
  )
}

function previousDay(day: string) {
  const index = weekDays.indexOf(day)
  if (index <= 0) return 'Sunday'
  return weekDays[index - 1]
}

function formatTime(time: string) {
  if (!time) return 'No time set'

  const [hourString, minute] = time.split(':')
  const hour = Number(hourString)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}