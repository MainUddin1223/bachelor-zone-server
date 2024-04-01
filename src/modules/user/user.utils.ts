import dayjs from 'dayjs';
export const getFormatDate = (date: any) => {
  const makeDate = dayjs(date);
  return makeDate.format('YYYY-MM-DD[T]00:00:00.000Z');
};

export const getFormatDateAndTime = (date: any) => {
  const makeDate = dayjs(date);
  return makeDate.format('YYYY-MM-DD[T]06:30:00.000Z');
};

export const isValidOrderDate = (date: string): boolean => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const deliveryDate = dayjs(date).startOf('hour');
  if (todayDate > deliveryDate) {
    return false;
  }
  return true;
};

export const isValidOrderForToday = (date: string): boolean => {
  const todayDate = dayjs(new Date()).startOf('hour');
  const deliveryDate = getFormatDate(todayDate).split('T')[0];
  const formatDeliveryDate = date.split('T')[0];
  const formatDate = getFormatDateAndTime(todayDate);
  if (deliveryDate == formatDeliveryDate && date > formatDate) {
    return false;
  }
  return true;
};
