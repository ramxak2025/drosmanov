import type { DaySchedule, TimeSlot } from '../types';

/**
 * Генерация доступных слотов для записи.
 *
 * @param daySchedule — расписание врача на день (start/end)
 * @param serviceDuration — длительность услуги в минутах
 * @param existingAppointments — занятые слоты [{start: "09:00", end: "10:00"}, ...]
 * @param slotStep — шаг сетки в минутах (по умолчанию 30)
 * @returns массив свободных слотов
 */
export function generateTimeSlots(
  daySchedule: DaySchedule | null,
  serviceDuration: number,
  existingAppointments: TimeSlot[],
  slotStep: number = 30,
): TimeSlot[] {
  if (!daySchedule) return [];

  const startMinutes = timeToMinutes(daySchedule.start);
  const endMinutes = timeToMinutes(daySchedule.end);
  const slots: TimeSlot[] = [];

  for (let current = startMinutes; current + serviceDuration <= endMinutes; current += slotStep) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + serviceDuration);

    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = timeToMinutes(apt.start);
      const aptEnd = timeToMinutes(apt.end);
      return current < aptEnd && current + serviceDuration > aptStart;
    });

    if (!hasConflict) {
      slots.push({ start: slotStart, end: slotEnd });
    }
  }

  return slots;
}

/**
 * Конвертация "HH:MM" в минуты от полуночи.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Конвертация минут от полуночи в "HH:MM".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Получение ключа дня недели из Date.
 */
export function getDayKey(date: Date): 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  return days[date.getDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
}
