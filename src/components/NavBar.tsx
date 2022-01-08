import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  Spacer,
} from "@chakra-ui/react";
import { MouseEventHandler } from "react";

interface NavBarProps {
  onVerifyClick: MouseEventHandler;
}

const NavBar = ({ onVerifyClick }: NavBarProps) => {
  const handleOfflineVerifyClick = () => {
    return chrome.tabs.create({
      url: chrome.runtime.getURL("offline_verification.html"),
    });
  };
  const handleResolveNamesClick = () => {
    return chrome.tabs.create({
      url: chrome.runtime.getURL("name_resolution.html"),
    });
  };

  return (
    <Box bg="black" w="100%">
      <Flex bg="black" p={4}>
        <Center>
          <Heading color="white" fontSize="2xl">
            VERIFIER
          </Heading>
        </Center>
        <Spacer />
        <ButtonGroup>
          <Button onClick={handleResolveNamesClick}>Resolve Names</Button>
          <Button onClick={handleOfflineVerifyClick}>Offline Verify</Button>
          <Button onClick={onVerifyClick}>Verify Page</Button>
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default NavBar;
