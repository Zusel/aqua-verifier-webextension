import { Link, ListItem, Text, Flex, Box } from "@chakra-ui/react";
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

const RenderWitnessDetail = ({ witnessDetail }: { witnessDetail: string }) => {
  return (
    <Box py={2}>
      {/* render as dangerous HTML for now 
        TODO: witnessDetail as properties
      */}
      <div dangerouslySetInnerHTML={{ __html: witnessDetail }} />
    </Box>
  );
};

const Revision = ({
  id,
  url,
  time,
  domainId,
  isVerified,
  witnessDetail,
  witness,
  signature,
  key,
}: RevisionProps & { key: number }) => {
  console.log({ signature });

  // Next steps: render signature and witness info
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
      {witnessDetail && <RenderWitnessDetail witnessDetail={witnessDetail} />}
    </ListItem>
  );
};

export default Revision;
