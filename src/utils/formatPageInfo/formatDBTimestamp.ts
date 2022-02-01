import dayjs from "dayjs";

const formatDBTimestamp = (ts: string) =>
  dayjs(ts, "YYYYMMDDHHmmss").format("MMM D YY, h:mm:ss A");

export default formatDBTimestamp;
