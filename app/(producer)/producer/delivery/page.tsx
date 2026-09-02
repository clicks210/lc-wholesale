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

type FulfillmentType =
  | 'local_connect'
  | 'self_fulfilled'

type ScheduleItem = {
  delivery_day: string
  cutoff_day: string
  cutoff_time: string
}

const LC_SCHEDULE: ScheduleItem[] = [
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

export default function ProducerDeliveryPage() {
  const [customerId, setCustomerId] = useState('')

  const [
    fulfillmentType,
    setFulfillmentType,
  ] =
    useState<FulfillmentType>(
      'local_connect'
    )

  const [
    deliverySchedule,
    setDeliverySchedule,
  ] = useState<ScheduleItem[]>([])

  const [
    dropoffNotes,
    setDropoffNotes,
  ] = useState('')

  const [
    agreedToLcTerms,
    setAgreedToLcTerms,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const activeSchedule =
    fulfillmentType ===
    'local_connect'
      ? LC_SCHEDULE
      : deliverySchedule

  /* =====================================================
     LOAD SETTINGS
  ===================================================== */

  useEffect(() => {
    loadDeliverySettings()
  }, [])

  async function loadDeliverySettings() {
    setLoading(true)
    setMessage('')

    const {
      data: userData,
    } =
      await supabase.auth.getUser()

    if (!userData.user) {
      setMessage(
        'You must be signed in.'
      )

      setLoading(false)
      return
    }

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from('customer_members')
      .select('customer_id')
      .eq(
        'user_id',
        userData.user.id
      )
      .limit(1)
      .single()

    if (
      membershipError ||
      !membership
    ) {
      setMessage(
        'Producer account could not be found.'
      )

      setLoading(false)
      return
    }

    setCustomerId(
      membership.customer_id
    )

    const {
      data,
      error,
    } = await supabase
      .from('producer_delivery')
      .select('*')
      .eq(
        'customer_id',
        membership.customer_id
      )
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (data) {
      setFulfillmentType(
        data.fulfillment_type ||
          'local_connect'
      )

      setDropoffNotes(
        data.dropoff_notes || ''
      )

      setAgreedToLcTerms(
        Boolean(
          data.agreed_to_lc_terms
        )
      )

      if (
        Array.isArray(
          data.delivery_schedule
        )
      ) {
        setDeliverySchedule(
          data.delivery_schedule
        )
      } else if (
        Array.isArray(
          data.delivery_days
        )
      ) {
        setDeliverySchedule(
          data.delivery_days.map(
            (day: string) => ({
              delivery_day: day,
              cutoff_day:
                'Monday',
              cutoff_time:
                '14:00',
            })
          )
        )
      }
    }

    setLoading(false)
  }

  /* =====================================================
     SCHEDULE EDITING
  ===================================================== */

  function toggleDeliveryDay(
    day: string
  ) {
    setDeliverySchedule(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.delivery_day ===
              day
          )

        if (exists) {
          return current.filter(
            (item) =>
              item.delivery_day !==
              day
          )
        }

        return [
          ...current,
          {
            delivery_day: day,
            cutoff_day:
              previousDay(day),
            cutoff_time:
              '14:00',
          },
        ]
      }
    )
  }

  function updateScheduleItem(
    deliveryDay: string,
    field: keyof ScheduleItem,
    value: string
  ) {
    setDeliverySchedule(
      (current) =>
        current.map(
          (item) =>
            item.delivery_day ===
            deliveryDay
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    )
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSave(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    if (
      fulfillmentType ===
        'local_connect' &&
      !agreedToLcTerms
    ) {
      setMessage(
        'You must agree to the Local Connect drop-off terms.'
      )

      setSaving(false)
      return
    }

    if (
      fulfillmentType ===
        'self_fulfilled' &&
      deliverySchedule.length === 0
    ) {
      setMessage(
        'Please select at least one delivery day.'
      )

      setSaving(false)
      return
    }

    const scheduleToSave =
      fulfillmentType ===
      'local_connect'
        ? activeSchedule
        : deliverySchedule

    const {
      error,
    } = await supabase
      .from('producer_delivery')
      .upsert(
        {
          customer_id:
            customerId,

          fulfillment_type:
            fulfillmentType,

          delivery_days:
            scheduleToSave.map(
              (item) =>
                item.delivery_day
            ),

          delivery_schedule:
            scheduleToSave,

          cutoff_time: null,

          lead_time_days: 0,

          dropoff_notes:
            dropoffNotes || null,

          agreed_to_lc_terms:
            fulfillmentType ===
            'local_connect'
              ? agreedToLcTerms
              : false,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'customer_id',
        }
      )

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage(
      'Delivery settings saved.'
    )

    setSaving(false)
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

        <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

          <div className="border border-[#aeb6ae] bg-white p-6">

            <div className="h-3 w-32 animate-pulse bg-[#dfe3df]" />

            <div className="mt-4 h-10 w-72 max-w-full animate-pulse bg-[#dfe3df]" />

            <div className="mt-3 h-3 w-96 max-w-full animate-pulse bg-[#e7eae7]" />

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f2f4f1] text-[#171b18]">

      <div className="mx-auto max-w-[1500px] px-3 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="border-b-2 border-[#aeb6ae] pb-6 sm:pb-8">

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f5a43]">
            Producer Fulfillment
          </p>

          <h1 className="mt-2 text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-[#171b18] sm:text-5xl">
            Delivery Settings
          </h1>

          <p className="mt-3 max-w-2xl text-[13px] font-medium leading-5 text-[#5f675f] sm:text-[15px] sm:leading-6">
            Choose how orders are fulfilled, set delivery days, and define exact ordering cutoffs.
          </p>

        </section>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSave}
          className="
            grid
            gap-8
            py-7
            lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]
            lg:gap-10
          "
        >

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="space-y-8">

            {/* FULFILLMENT */}

            <FormSection
              eyebrow="01"
              title="Fulfillment Method"
              description="Choose whether Local Connect handles last-mile delivery or you deliver directly to buyers."
            >

              <div className="grid gap-3 md:grid-cols-2">

                <FulfillmentOption
                  selected={
                    fulfillmentType ===
                    'local_connect'
                  }
                  title="Fulfilled by Local Connect"
                  description="Orders close Sunday and Wednesday at 5 PM. Deliver product to the Local Connect warehouse Monday and Thursday."
                  badge="Warehouse Drop-Off"
                  onClick={() =>
                    setFulfillmentType(
                      'local_connect'
                    )
                  }
                />

                <FulfillmentOption
                  selected={
                    fulfillmentType ===
                    'self_fulfilled'
                  }
                  title="Self Fulfilled"
                  description="You deliver directly to buyer locations on the delivery days you configure."
                  badge="Direct Delivery"
                  onClick={() =>
                    setFulfillmentType(
                      'self_fulfilled'
                    )
                  }
                />

              </div>

            </FormSection>

            {/* =================================================
                LOCAL CONNECT FULFILLMENT
            ================================================= */}

            {fulfillmentType ===
            'local_connect' ? (

              <FormSection
                eyebrow="02"
                title="Local Connect Drop-Off"
                description="These fixed warehouse drop-off windows support Local Connect delivery routes."
              >

                {/* SCHEDULE */}

                <div className="grid gap-px border border-[#aeb6ae] bg-[#aeb6ae] md:grid-cols-2">

                  {activeSchedule.map(
                    (item) => (
                      <ScheduleSummaryCard
                        key={
                          item.delivery_day
                        }
                        item={item}
                      />
                    )
                  )}

                </div>

                {/* TERMS */}

                <button
                  type="button"
                  onClick={() =>
                    setAgreedToLcTerms(
                      !agreedToLcTerms
                    )
                  }
                  className="
                    mt-5
                    flex
                    w-full
                    items-start
                    justify-between
                    gap-4
                    border
                    border-[#aeb6ae]
                    bg-[#f7f8f5]
                    p-4
                    text-left
                    transition-colors
                    hover:bg-[#edf1ed]
                  "
                >

                  <span className="pr-3">

                    <span className="block text-[12px] font-bold text-[#252b27]">
                      I agree to the Local Connect drop-off schedule
                    </span>

                    <span className="mt-1 block text-[10px] font-medium leading-5 text-[#5f675f]">
                      Products will be delivered to the Local Connect warehouse Monday and Thursday after order cutoffs Sunday and Wednesday at 5 PM.
                    </span>

                  </span>

                  <span
                    className={`
                      relative
                      mt-1
                      h-6
                      w-11
                      shrink-0
                      transition-colors

                      ${
                        agreedToLcTerms
                          ? 'bg-[#1f5a43]'
                          : 'bg-[#aeb6ae]'
                      }
                    `}
                  >

                    <span
                      className={`
                        absolute
                        top-1
                        h-4
                        w-4
                        bg-white
                        transition-transform

                        ${
                          agreedToLcTerms
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }
                      `}
                    />

                  </span>

                </button>

                <Notes
                  value={
                    dropoffNotes
                  }
                  setValue={
                    setDropoffNotes
                  }
                  placeholder="Example: receiving instructions, contact notes, pallet details..."
                />

              </FormSection>

            ) : (

              /* =================================================
                 SELF FULFILLED
              ================================================= */

              <FormSection
                eyebrow="02"
                title="Delivery Days & Cutoffs"
                description="Select each buyer delivery day, then define when orders must be submitted."
              >

                {/* DAY SELECTOR */}

                <div>

                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3f4740]">
                    Delivery Days
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">

                    {weekDays.map(
                      (day) => {
                        const selected =
                          deliverySchedule.some(
                            (item) =>
                              item.delivery_day ===
                              day
                          )

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              toggleDeliveryDay(
                                day
                              )
                            }
                            className={`
                              min-h-11
                              border
                              px-2
                              text-[9px]
                              font-black
                              uppercase
                              tracking-[0.07em]
                              transition-colors

                              ${
                                selected
                                  ? 'border-[#1f5a43] bg-[#1f5a43] text-white'
                                  : 'border-[#aeb6ae] bg-white text-[#4f5750] hover:border-[#1f5a43] hover:text-[#1f5a43]'
                              }
                            `}
                          >
                            {day}
                          </button>
                        )
                      }
                    )}

                  </div>

                </div>

                {/* CONFIGURED DAYS */}

                {deliverySchedule.length >
                0 ? (
                  <div className="mt-6 space-y-3">

                    {deliverySchedule.map(
                      (
                        item,
                        index
                      ) => (
                        <ScheduleEditor
                          key={
                            item.delivery_day
                          }
                          item={item}
                          index={index}
                          updateScheduleItem={
                            updateScheduleItem
                          }
                        />
                      )
                    )}

                  </div>
                ) : (
                  <div className="mt-6 border border-dashed border-[#aeb6ae] bg-[#f7f8f5] px-4 py-10 text-center">

                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#596159]">
                      No Delivery Days Selected
                    </p>

                    <p className="mt-2 text-[11px] font-medium text-[#737b74]">
                      Select one or more days above to configure cutoffs.
                    </p>

                  </div>
                )}

                <Notes
                  value={
                    dropoffNotes
                  }
                  setValue={
                    setDropoffNotes
                  }
                  placeholder="Example: delivery area, minimum order, route notes, contact instructions..."
                />

              </FormSection>
            )}

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside>

            <section
              className="
                sticky
                top-5
                border
                border-[#aeb6ae]
                bg-white
              "
            >

              {/* HEADER */}

              <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#596159]">
                  Schedule Overview
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#202621]">
                  Weekly Calendar
                </h2>

                <p className="mt-1.5 text-[11px] font-medium leading-5 text-[#5f675f]">
                  Review delivery days and order cutoffs before saving.
                </p>

              </div>

              <div className="p-5 sm:p-6">

                {/* MODE SUMMARY */}

                <div className="mb-5 grid grid-cols-2 gap-px border border-[#aeb6ae] bg-[#aeb6ae]">

                  <SummaryItem
                    label="Method"
                    value={
                      fulfillmentType ===
                      'local_connect'
                        ? 'Local Connect'
                        : 'Self Fulfilled'
                    }
                  />

                  <SummaryItem
                    label="Delivery Days"
                    value={String(
                      activeSchedule.length
                    )}
                  />

                </div>

                {/* CALENDAR */}

                <CalendarPreview
                  schedule={
                    activeSchedule
                  }
                />

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    mt-6
                    flex
                    min-h-14
                    w-full
                    items-center
                    justify-center
                    bg-[#1f5a43]
                    px-5
                    text-[11px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-white
                    transition-colors
                    hover:bg-[#163f30]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Delivery Settings'}
                </button>

                {message && (
                  <div
                    className="
                      mt-4
                      border
                      border-[#aeb6ae]
                      bg-[#f7f8f5]
                      p-3
                      text-[11px]
                      font-semibold
                      leading-5
                      text-[#4f5750]
                    "
                  >
                    {message}
                  </div>
                )}

              </div>

            </section>

          </aside>

        </form>

      </div>

    </main>
  )
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-[#aeb6ae] bg-white">

      <div className="border-b border-[#aeb6ae] bg-[#f7f8f5] px-5 py-5 sm:px-6">

        <div className="flex items-start gap-4">

          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              bg-[#dfe9e3]
              text-[10px]
              font-black
              text-[#1f5a43]
            "
          >
            {eyebrow}
          </span>

          <div>

            <h2 className="text-xl font-bold tracking-[-0.025em] text-[#202621]">
              {title}
            </h2>

            {description && (
              <p className="mt-1.5 max-w-2xl text-[12px] font-medium leading-5 text-[#5f675f]">
                {description}
              </p>
            )}

          </div>

        </div>

      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>

    </section>
  )
}

/* =========================================================
   FULFILLMENT OPTION
========================================================= */

function FulfillmentOption({
  selected,
  title,
  description,
  badge,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  badge: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        min-h-[190px]
        border
        p-5
        text-left
        transition-colors

        ${
          selected
            ? 'border-[#1f5a43] bg-[#eef3f0]'
            : 'border-[#aeb6ae] bg-white hover:border-[#1f5a43]'
        }
      `}
    >

      {selected && (
        <span className="absolute left-0 top-0 h-full w-[4px] bg-[#1f5a43]" />
      )}

      <div className="flex items-start justify-between gap-3">

        <span
          className={`
            px-2.5
            py-1
            text-[8px]
            font-black
            uppercase
            tracking-[0.1em]

            ${
              selected
                ? 'bg-[#1f5a43] text-white'
                : 'bg-[#e9ece8] text-[#596159]'
            }
          `}
        >
          {badge}
        </span>

        <span
          className={`
            flex
            h-5
            w-5
            items-center
            justify-center
            border

            ${
              selected
                ? 'border-[#1f5a43] bg-[#1f5a43]'
                : 'border-[#8f9990]'
            }
          `}
        >
          {selected && (
            <span className="h-2 w-2 bg-white" />
          )}
        </span>

      </div>

      <h3 className="mt-5 text-[15px] font-bold leading-tight text-[#202621]">
        {title}
      </h3>

      <p className="mt-2 text-[11px] font-medium leading-5 text-[#5f675f]">
        {description}
      </p>

    </button>
  )
}

/* =========================================================
   LC SCHEDULE CARD
========================================================= */

function ScheduleSummaryCard({
  item,
}: {
  item: ScheduleItem
}) {
  return (
    <div className="bg-white p-4 sm:p-5">

      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#1f5a43]">
        Warehouse Drop-Off
      </p>

      <p className="mt-2 text-xl font-bold tracking-[-0.035em] text-[#202621]">
        {item.delivery_day}
      </p>

      <div className="mt-4 border-t border-[#c5cbc5] pt-3">

        <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#596159]">
          Order Cutoff
        </p>

        <p className="mt-1 text-[12px] font-bold text-[#303732]">
          {item.cutoff_day} at{' '}
          {formatTime(
            item.cutoff_time
          )}
        </p>

      </div>

    </div>
  )
}

/* =========================================================
   SCHEDULE EDITOR
========================================================= */

function ScheduleEditor({
  item,
  index,
  updateScheduleItem,
}: {
  item: ScheduleItem
  index: number
  updateScheduleItem: (
    deliveryDay: string,
    field: keyof ScheduleItem,
    value: string
  ) => void
}) {
  return (
    <div className="border border-[#aeb6ae] bg-white">

      <div className="flex items-center justify-between border-b border-[#bfc5bf] bg-[#f7f8f5] px-4 py-3">

        <div>

          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#1f5a43]">
            Delivery {String(index + 1).padStart(2, '0')}
          </p>

          <h3 className="mt-1 text-[15px] font-bold text-[#202621]">
            {item.delivery_day}
          </h3>

        </div>

        <span className="bg-[#dfe9e3] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#1f5a43]">
          Active
        </span>

      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">

        <FieldLabel
          label="Cutoff Day"
        >

          <div className="relative">

            <select
              value={
                item.cutoff_day
              }
              onChange={(e) =>
                updateScheduleItem(
                  item.delivery_day,
                  'cutoff_day',
                  e.target.value
                )
              }
              className={`${inputClass} appearance-none pr-10`}
            >

              {weekDays.map(
                (day) => (
                  <option
                    key={day}
                    value={day}
                  >
                    {day}
                  </option>
                )
              )}

            </select>

            <Chevron />

          </div>

        </FieldLabel>

        <FieldLabel
          label="Cutoff Time"
        >

          <input
            type="time"
            value={
              item.cutoff_time
            }
            onChange={(e) =>
              updateScheduleItem(
                item.delivery_day,
                'cutoff_time',
                e.target.value
              )
            }
            className={inputClass}
          />

        </FieldLabel>

      </div>

    </div>
  )
}

/* =========================================================
   NOTES
========================================================= */

function Notes({
  value,
  setValue,
  placeholder,
}: {
  value: string
  setValue:
    (value: string) => void
  placeholder: string
}) {
  return (
    <label className="mt-6 block">

      <div className="mb-2 flex items-end justify-between gap-3">

        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3f4740]">
          Delivery Notes
        </span>

        <span className="text-[9px] font-medium text-[#737b74]">
          Optional
        </span>

      </div>

      <textarea
        rows={5}
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value
          )
        }
        placeholder={placeholder}
        className={`${inputClass} min-h-[130px] resize-y py-3`}
      />

    </label>
  )
}

/* =========================================================
   CALENDAR PREVIEW
========================================================= */

function CalendarPreview({
  schedule,
}: {
  schedule: ScheduleItem[]
}) {
  return (
    <div className="border border-[#aeb6ae]">

      {weekDays.map(
        (day, dayIndex) => {
          const events =
            schedule.flatMap(
              (item) => {
                const items: {
                  type:
                    | 'cutoff'
                    | 'delivery'
                  label: string
                  detail: string
                }[] = []

                if (
                  item.cutoff_day ===
                  day
                ) {
                  items.push({
                    type: 'cutoff',
                    label:
                      `Cutoff · ${item.delivery_day}`,
                    detail:
                      formatTime(
                        item.cutoff_time
                      ),
                  })
                }

                if (
                  item.delivery_day ===
                  day
                ) {
                  items.push({
                    type: 'delivery',
                    label:
                      `${item.delivery_day} Delivery`,
                    detail:
                      'Delivery day',
                  })
                }

                return items
              }
            )

          return (
            <div
              key={day}
              className={`
                grid
                grid-cols-[88px_1fr]
                gap-3
                px-3
                py-3

                ${
                  dayIndex !==
                  weekDays.length -
                    1
                    ? 'border-b border-[#c5cbc5]'
                    : ''
                }
              `}
            >

              <p className="pt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#596159]">
                {day.slice(
                  0,
                  3
                )}
              </p>

              <div className="min-w-0 space-y-1.5">

                {events.length ===
                0 ? (
                  <p className="py-1 text-[10px] font-medium text-[#9aa09b]">
                    —
                  </p>
                ) : (
                  events.map(
                    (
                      event,
                      index
                    ) => (
                      <div
                        key={`${event.label}-${index}`}
                        className={`
                          border-l-[3px]
                          px-2.5
                          py-2

                          ${
                            event.type ===
                            'delivery'
                              ? 'border-[#1f5a43] bg-[#eef3f0]'
                              : 'border-[#d98a3a] bg-[#fff0dc]'
                          }
                        `}
                      >

                        <p
                          className={`
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.06em]

                            ${
                              event.type ===
                              'delivery'
                                ? 'text-[#1f5a43]'
                                : 'text-[#754512]'
                            }
                          `}
                        >
                          {event.label}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] font-semibold text-[#5f675f]">
                          {event.detail}
                        </p>

                      </div>
                    )
                  )
                )}

              </div>

            </div>
          )
        }
      )}

    </div>
  )
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-white p-3">

      <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#596159]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-bold text-[#303732]">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   FIELD LABEL
========================================================= */

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3f4740]">
        {label}
      </span>

      {children}

    </label>
  )
}

/* =========================================================
   INPUT
========================================================= */

const inputClass = `
  min-h-12
  w-full
  border
  border-[#aeb6ae]
  bg-white
  px-4
  text-[13px]
  font-semibold
  text-[#202621]
  outline-none
  transition-colors
  placeholder:font-medium
  placeholder:text-[#929994]
  hover:border-[#8f9990]
  focus:border-[#1f5a43]
  focus:ring-1
  focus:ring-[#1f5a43]/20
`

/* =========================================================
   ICON
========================================================= */

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#596159]"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* =========================================================
   HELPERS
========================================================= */

function previousDay(
  day: string
) {
  const index =
    weekDays.indexOf(day)

  if (index <= 0) {
    return 'Sunday'
  }

  return weekDays[
    index - 1
  ]
}

function formatTime(
  time: string
) {
  if (!time) {
    return 'No time set'
  }

  const [
    hourString,
    minute,
  ] = time.split(':')

  const hour =
    Number(hourString)

  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM'

  const displayHour =
    hour % 12 || 12

  return `${displayHour}:${minute} ${suffix}`
}