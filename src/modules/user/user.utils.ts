import dayjs from 'dayjs';

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
  const deliveryDate = todayDate
    .format('YYYY-MM-DD[T]00:00:00.000Z')
    .split('T')[0];
  const formatDeliveryDate = date.split('T')[0];
  const formatDate = todayDate.format('YYYY-MM-DD[T]06:30:00.000Z');
  console.log(deliveryDate, formatDeliveryDate);
  if (deliveryDate == formatDeliveryDate && date > formatDate) {
    return false;
  }
  return true;
};
