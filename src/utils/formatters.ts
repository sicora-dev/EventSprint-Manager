import dayjs from 'dayjs';

export const formatDateTime = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  return dayjs(value).format('DD/MM/YYYY HH:mm');
};

export const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  return dayjs(value).format('YYYY-MM-DDTHH:mm');
};
