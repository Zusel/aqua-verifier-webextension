import { Heading, Box, Badge, OrderedList, Progress } from "@chakra-ui/react";
import Revision from "./Revision";
import { pathOr } from "ramda";

interface VerificationLogProps {
  verificationLog: any;
}
import type { RevisionProps } from "../../utils/formatPageInfo";

const VerificationLog = ({ verificationLog }: VerificationLogProps) => {
  const { count, revisions } = verificationLog;
  console.log({ verificationLog });
  return (
    <Box p={4} mb={4}>
      {!count ? (
        <Progress size="xs" isIndeterminate />
      ) : (
        <>
          <Heading as="h3" mb={2}>
            <Badge
              fontSize="inherit"
              colorScheme="green"
              variant="solid"
              mr={2}
            >
              {count}
            </Badge>
            Verified Page Revisions
          </Heading>
          <OrderedList spacing={3}>
            {revisions.map((revision: RevisionProps, index: number) => {
              return (
                <Revision
                  key={index}
                  id={revision.id}
                  url={revision.url}
                  time={revision.time}
                  isVerified={revision.isVerified}
                  domainId={revision.domainId}
                  witness={revision.witness}
                  witnessDetail={revision.witnessDetail}
                  signature={revision.signature}
                />
              );
            })}
          </OrderedList>
        </>
      )}
    </Box>
  );
};

export default VerificationLog;
