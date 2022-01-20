import { extendTheme } from "@chakra-ui/react";
import {
  BadgeColorBlue,
  BadgeColorYellow,
  BadgeColorNA,
  BadgeColorSuccess,
  BadgeColorError,
} from "../../../verifier";
const theme = extendTheme({
  fonts: {
    heading: "Montserrat-Bold",
    body: "Montserrat-Regular",
  },
  colors: {
    success: BadgeColorSuccess,
    warning: BadgeColorYellow,
    error: BadgeColorError,
    unsure: BadgeColorBlue,
    na: BadgeColorNA,
  },
});

export default theme;
