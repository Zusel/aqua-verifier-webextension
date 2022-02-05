import {
  Heading,
  Box,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
} from "@chakra-ui/react";
import RevisionRow from "./RevisionRow";

interface VerificationLogProps {
  verificationLog: any;
}
import type { RevisionProps } from "../../utils/formatPageInfo";
// TODO: use better Revision typing
const VerificationLog = ({ verificationLog }: VerificationLogProps) => {
  const { count, revisions } = verificationLog;
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
          <Table variant="striped" size="md">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Time (UTC)</Th>
                <Th>Domain ID</Th>
                <Th>Verification Hash Matches</Th>
                <Th>Witness Event</Th>
                <Th>Signature</Th>
              </Tr>
            </Thead>
            <Tbody>
              {revisions.map((revision: RevisionProps, index: number) => (
                <RevisionRow
                  key={`${index}-${revision.id}`}
                  index={index}
                  revision={revision}
                />
              ))}
            </Tbody>
          </Table>
        </>
      )}
    </Box>
  );
};

export default VerificationLog;
