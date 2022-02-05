import dayjs from "dayjs";

export const formatDBTimestamp = (ts: string) =>
  dayjs(ts, "YYYYMMDDHHmmss").format("DD MMM YYYY, h:mm:ss A");

export type FormatDBTimestampToObject = {
  date: string;
  time: string;
};
export const formatDBTimestampToObject = (
  ts: string
): FormatDBTimestampToObject => {
  const date = dayjs(ts, "YYYYMMDDHHmmss").format("DD MMM YYYY");
  const time = dayjs(ts, "YYYYMMDDHHmmss").format("h:mm:ss A");

  return {
    date,
    time,
  };
};
