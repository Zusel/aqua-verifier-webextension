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
      {isVerified ? (
        <CheckCircleIcon color="green" boxSize={6} />
      ) : (
        <WarningTwoIcon color="red" boxSize={6} />
      )}
      <Text ml={4}>
        Verificiation hash {isVerified ? `matches` : " does not match"}
      </Text>
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
        <ExternalLinkIcon color="blue" boxSize={4} />
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
