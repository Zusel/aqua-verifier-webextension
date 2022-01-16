import { Heading, Box, Badge, OrderedList, ListItem } from "@chakra-ui/react";

interface VerificationLogProps {
  verificationLog: any;
}

const Revision = (revId: any) => {
  console.log(revId);
  return (
    <ListItem key={revId}>
      Verification of{" "}
      <a href={revId} target="_blank">
        Revision ID {revId}
      </a>
    </ListItem>
  );
};

const VerificationLog = ({ verificationLog }: VerificationLogProps) => {
  const { count, revisionsArray } = verificationLog;
  console.log({ verificationLog });
  console.log({ revisionsArray });
  return (
    <Box mb={4}>
      <Heading as="h3" mb={2}>
        <Badge fontSize="inherit" colorScheme="green" variant="solid" mr={2}>
          {count}
        </Badge>
        Verified Page Revisions
      </Heading>
      <OrderedList spacing={3}>
        {revisionsArray &&
          revisionsArray.map((revision: any) => {
            const { rev_id } = revision;
            return <Revision revId={rev_id} />;
          })}
      </OrderedList>
    </Box>
  );
};

export default VerificationLog;
