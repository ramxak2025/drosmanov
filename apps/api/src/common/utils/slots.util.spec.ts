import { generateTimeSlots, timeToMinutes, minutesToTime, getDayKey } from '../../../../packages/shared/src/utils/slots.util';

describe('slots.util', () => {
  describe('timeToMinutes', () => {
    it('converts 09:00 to 540', () => {
      expect(timeToMinutes('09:00')).toBe(540);
    });

    it('converts 18:30 to 1110', () => {
      expect(timeToMinutes('18:30')).toBe(1110);
    });

    it('converts 00:00 to 0', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });
  });

  describe('minutesToTime', () => {
    it('converts 540 to 09:00', () => {
      expect(minutesToTime(540)).toBe('09:00');
    });

    it('converts 1110 to 18:30', () => {
      expect(minutesToTime(1110)).toBe('18:30');
    });
  });

  describe('getDayKey', () => {
    it('returns correct day for Monday', () => {
      const monday = new Date('2024-03-18'); // Monday
      expect(getDayKey(monday)).toBe('mon');
    });

    it('returns correct day for Sunday', () => {
      const sunday = new Date('2024-03-17'); // Sunday
      expect(getDayKey(sunday)).toBe('sun');
    });
  });

  describe('generateTimeSlots', () => {
    it('generates correct slots for empty schedule', () => {
      const slots = generateTimeSlots(
        { start: '09:00', end: '12:00' },
        60,
        [],
        30,
      );
      expect(slots).toEqual([
        { start: '09:00', end: '10:00' },
        { start: '09:30', end: '10:30' },
        { start: '10:00', end: '11:00' },
        { start: '10:30', end: '11:30' },
        { start: '11:00', end: '12:00' },
      ]);
    });

    it('returns empty for null schedule (day off)', () => {
      const slots = generateTimeSlots(null, 60, []);
      expect(slots).toEqual([]);
    });

    it('excludes slots that overlap with existing appointments', () => {
      const slots = generateTimeSlots(
        { start: '09:00', end: '12:00' },
        60,
        [{ start: '10:00', end: '11:00' }],
        30,
      );

      // Should not include any slot that overlaps with 10:00-11:00
      for (const slot of slots) {
        const slotStart = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end);
        const aptStart = timeToMinutes('10:00');
        const aptEnd = timeToMinutes('11:00');
        const overlaps = slotStart < aptEnd && slotEnd > aptStart;
        expect(overlaps).toBe(false);
      }
    });

    it('handles service duration longer than remaining time', () => {
      const slots = generateTimeSlots(
        { start: '17:00', end: '18:00' },
        90, // 90 min service doesn't fit in 60 min
        [],
      );
      expect(slots).toEqual([]);
    });

    it('handles multiple existing appointments', () => {
      const slots = generateTimeSlots(
        { start: '09:00', end: '18:00' },
        30,
        [
          { start: '09:00', end: '10:00' },
          { start: '12:00', end: '13:00' },
          { start: '15:00', end: '16:00' },
        ],
      );

      // None of the returned slots should conflict
      for (const slot of slots) {
        const sStart = timeToMinutes(slot.start);
        const sEnd = timeToMinutes(slot.end);
        const conflicts = [
          { start: timeToMinutes('09:00'), end: timeToMinutes('10:00') },
          { start: timeToMinutes('12:00'), end: timeToMinutes('13:00') },
          { start: timeToMinutes('15:00'), end: timeToMinutes('16:00') },
        ];
        for (const c of conflicts) {
          expect(sStart < c.end && sEnd > c.start).toBe(false);
        }
      }
    });
  });
});
