import dayjs from "dayjs";
export const formatDBTimestamp = (ts: any) => {
  return dayjs(ts, "YYYYMMDDHHmmss").format("MMM D YYYY, h:mm:ss A") + " UTC";
};
