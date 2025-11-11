// src/utils/clockQr.ts
export interface ClockQrPayload {
    event_id: string
    creator_id: string
    generated_at: string
    type: 'clock_in' | 'clock_out'
  }
  
  export function buildClockQrPayload({
    eventId,
    creatorId,
    type,
  }: {
    eventId: string
    creatorId: string
    type: 'clock_in' | 'clock_out'
  }): ClockQrPayload {
    return {
      event_id: eventId,
      creator_id: creatorId,
      generated_at: new Date().toISOString(),
      type,
    }
  }