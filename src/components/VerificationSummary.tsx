import { Flex, Heading, Spacer, Text, Box } from "@chakra-ui/react";

interface VerificationSummaryProps {
  pageTitle: string;
  verificationStatus: any;
}

const VerificationSummary = ({
  pageTitle,
  verificationStatus,
}: VerificationSummaryProps) => {
  return (
    <>
      <Flex direction="row">
        <Heading fontSize="2xl">
          {pageTitle ? pageTitle : "[Unsupported]"}
        </Heading>
        <Spacer />
        <Text>CURRENT PAGE</Text>
      </Flex>
      <Box
        border="dashed 4px #c9c9c9"
        rounded={10}
        paddingX={10}
        paddingY={4}
        marginY={2}
      >
        <Text color="blackAlpha.600">PAGE INTEGRETY</Text>
        <Box
          fontSize="xl"
          dangerouslySetInnerHTML={{ __html: verificationStatus }}
        />
      </Box>
    </>
  );
};

export default VerificationSummary;
