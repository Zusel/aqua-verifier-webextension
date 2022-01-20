import { Link, ListItem, Text, Flex } from "@chakra-ui/react";
import {
  CheckCircleIcon,
  WarningTwoIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import type { RevisionProps } from "../../utils/formatPageInfo";

const VerificationHash = ({ isVerified }: { isVerified: boolean }) => {
  return (
    <Flex alignItems="center">
      <Text mr={4}>
        Verificiation hash {isVerified ? `matches` : " does not match"}
      </Text>
      {isVerified ? (
        <CheckCircleIcon color="success" boxSize={6} />
      ) : (
        <WarningTwoIcon color="error" boxSize={6} />
      )}
    </Flex>
  );
};

const Revision = ({
  id,
  url,
  time,
  domainId,
  isVerified,
  key,
}: RevisionProps & { key: number }) => {
  return (
    <ListItem key={key}>
      <Link href={url} target="_blank" isExternal textDecoration="underline">
        Revision ID: <b>{id}</b>
        <ExternalLinkIcon color="blue" boxSize={4} ml={2} />
      </Link>
      <Text>{time}</Text>
      <Text>
        Domain ID: <b>{domainId}</b>
      </Text>
      <VerificationHash isVerified={isVerified} />
    </ListItem>
  );
};

export default Revision;
