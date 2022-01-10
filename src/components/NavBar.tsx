import { Center, Flex, Heading, Spacer } from "@chakra-ui/react";
import { ReactNode } from "react";

interface NavBarProps {
  toolbar?: ReactNode;
  pageSubtitle?: string;
}

const NavBar = ({ toolbar, pageSubtitle }: NavBarProps) => {
  return (
    <Flex bg="#343a40" width="100%" padding={4}>
      <Center>
        <Heading color="white" fontSize="2xl">
          VERIFIER{pageSubtitle ? ` // ${pageSubtitle}` : null}
        </Heading>
      </Center>
      <Spacer />
      {toolbar ? toolbar : null}
    </Flex>
  );
};

export default NavBar;
