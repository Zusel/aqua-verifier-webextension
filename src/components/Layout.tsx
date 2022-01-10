import { ChakraProvider } from "@chakra-ui/react";
import { ReactNode } from "react";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
  toolbar?: ReactNode;
  pageSubtitle?: string;
}

const Layout = ({ children, toolbar, pageSubtitle }: LayoutProps) => (
  <ChakraProvider>
    <NavBar toolbar={toolbar} pageSubtitle={pageSubtitle} />
    {children}
  </ChakraProvider>
);

export default Layout;
