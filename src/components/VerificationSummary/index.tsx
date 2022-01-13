import { Heading, Box } from "@chakra-ui/react";
import VerificationStatus from "../VerificationStatus";
interface VerificationSummaryProps {
  pageTitle: string;
  verificationStatus: any;
}

const VerificationSummary = ({
  pageTitle,
  verificationStatus,
}: VerificationSummaryProps) => {
  return (
    <Box mb={4}>
      <Heading as="h2" fontSize="2xl" mb={2}>
        {pageTitle}
      </Heading>
      <Box border="dashed 3px #c9c9c9" rounded={2} px={10} py={4}>
        <VerificationStatus verificationStatus={verificationStatus} />
      </Box>
    </Box>
  );
};

export default VerificationSummary;
