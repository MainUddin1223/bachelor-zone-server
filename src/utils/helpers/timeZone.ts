import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatLocalTime = (
  date: any,
  formatValue = 'YYYY-MM-DD[T]00:00:00.000Z'
) => {
  const formatDateAndTime = dayjs(date)
    .tz('Asia/Dhaka')
    .format('YYYY-MM-DD[T]HH:mm:ss.sssZ');
  const localDate = formatDateAndTime.split('T')[0];
  const formatDefaultDateAndTime = dayjs(date)
    .tz('Asia/Dhaka')
    .format('YYYY-MM-DD[T]00:00:00.000[Z]');
  const formatWithHourDateAndTime = dayjs(date)
    .tz('Asia/Dhaka')
    .format(formatValue);
  return {
    localTimeAndDate: formatDateAndTime,
    localDate,
    formatDefaultDateAndTime,
    formatWithHourDateAndTime,
  };
};
