import { Heading, Text } from "@chakra-ui/react";

export interface VerificationStatusProps {
  title: string;
  subtitle: any;
  keyColor: string;
}

type VerificationStatus = {
  verificationStatus: VerificationStatusProps;
};

const VerificationStatus = ({ verificationStatus }: VerificationStatus) => {
  return (
    <>
      <Heading fontSize="2xl" color={verificationStatus.keyColor}>
        {verificationStatus.title}
      </Heading>
      <Text fontSize="md">{verificationStatus.subtitle}</Text>
    </>
  );
};

export default VerificationStatus;
