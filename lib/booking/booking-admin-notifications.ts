import { notifyAdmins } from '@/lib/integrations/push';

type BookingNotificationKind = 'created' | 'rescheduled' | 'cancelled' | 'kia_created';

export async function notifyBookingAdminActivity(input: {
  kind: BookingNotificationKind;
  appointmentId: string;
  name: string;
  service: string;
  localDate: string;
  localTime: string;
  email?: string | null;
}) {
  const labels: Record<BookingNotificationKind, string> = {
    created: 'Nueva reunión confirmada',
    rescheduled: 'Reunión reprogramada',
    cancelled: 'Reunión cancelada',
    kia_created: 'KIA creó una reunión',
  };

  const detail = [
    input.name,
    input.service,
    input.localDate,
    input.localTime,
    input.email ?? '',
  ].filter(Boolean).join(' · ');

  await notifyAdmins({
    title: labels[input.kind],
    body: detail.slice(0, 240),
    url: '/admin/citas',
    tag: `booking-${input.kind}-${input.appointmentId}`,
  });
}
