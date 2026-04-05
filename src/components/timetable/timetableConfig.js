export const SCHOOL_DAYS = Array.from({ length: 10 }, (_, index) => index + 1);

export const DAY_NAME_MAP = {
  1: 'Monday (Week A)',
  2: 'Tuesday (Week A)',
  3: 'Wednesday (Week A)',
  4: 'Thursday (Week A)',
  5: 'Friday (Week A)',
  6: 'Monday (Week B)',
  7: 'Tuesday (Week B)',
  8: 'Wednesday (Week B)',
  9: 'Thursday (Week B)',
  10: 'Friday (Week B)'
};

export const PERIOD_SCHEDULE = {
  '1': { label: '8:35am–9:35am', startTime: '8:35am', endTime: '9:35am' },
  '2': { label: '9:40am–10:40am', startTime: '9:40am', endTime: '10:40am' },
  Tutorial: { label: '10:45am–10:55am', startTime: '10:45am', endTime: '10:55am' },
  Recess: { label: '10:55am–11:25am', startTime: '10:55am', endTime: '11:25am' },
  '3': { label: '11:25am–12:25pm', startTime: '11:25am', endTime: '12:25pm' },
  '4': { label: '12:30pm–1:30pm', startTime: '12:30pm', endTime: '1:30pm' },
  Lunch: { label: '1:30pm–2:25pm', startTime: '1:30pm', endTime: '2:25pm' },
  '5': { label: '2:25pm–3:25pm', startTime: '2:25pm', endTime: '3:25pm' },
  'After School': { label: '3:35pm–4:30pm', startTime: '3:35pm', endTime: '4:30pm' }
};

export const getDayName = (dayNum) => DAY_NAME_MAP[dayNum] || `Day ${dayNum}`;

export const createEmptySlotForPeriod = (day, period) => {
  const schedule = PERIOD_SCHEDULE[period] || {};

  return {
    day,
    period,
    startTime: schedule.startTime || '',
    endTime: schedule.endTime || '',
    subject: '',
    code: '',
    room: '',
    teacher: ''
  };
};
