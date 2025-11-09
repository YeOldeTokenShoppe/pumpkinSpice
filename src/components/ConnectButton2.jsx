import Image from "next/image";
// import { Link, Button } from "@chakra-ui/react";
import { ConnectButton, darkTheme } from "thirdweb";
import { client } from "../client";
import { CHAIN } from "@/utilities/constants";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { ThirdwebProvider, MediaRenderer } from "thirdweb";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

const wallets = [
  createWallet("io.metamask"),
  createWallet("org.uniswap"),

  createWallet("walletConnect", {
    projectId: projectId,
  }),
];

export const ConnectButton2 = () => (
  <ConnectButton
    className="burnButton"
    button={{ className: "burnButton" }}
    label={"Connect Wallet"}
    client={client}
    chain={CHAIN}
    wallets={wallets}
    connectButton={{
      className: "custom-button",
      label: "Connect Wallet",
    }}
    appMetadata={{
      name: "𝓞𝖚𝖗 𝕷𝖆𝖉𝖞 𝔬𝔣 𝕻𝖊𝖗𝖕𝖊𝖙𝖚𝖆𝖑 𝕻𝖗𝖔𝖋𝖎𝖙",
      url: "https://ourlady.io",
      // logoUrl: "https://ourlady.io/ourlady.svg",
    }}
    theme={darkTheme({
      colors: {
        accentText: "#d3b1c8",
        accentButtonBg: "#d3b1c8",
        accentButtonText: "#161316",
        borderColor: "#E9C162",
        modalBg: "#1B1724",
        selectedTextColor: "#fff",
        secondaryButtonText: "#fff",
        primaryButtonText: "#ffffff",
        connectedButtonBgHover: "#b26e9c",
        separatorLine: "#E9C162",
        selectedTextBg: "#ffffff",
        secondaryIconHoverColor: "#E9C162",
        primaryText: "#E9C162",
        secondaryText: "#706f78",
        connectedButtonBg: "#d3b1c8",
        secondaryButtonHoverBg: "#b26e9c",
        primaryButtonBg: "#b26e9c",
        secondaryIconHoverBg: "#b26e9c",
      },
    })}
    showAllWallets={true}
    connectModal={{
      size: "wide",
      zindex: 911,
      title: "Connect to OLOPP",
      titleIcon: "/ourlady.svg",
      welcomeScreen: () => {
        return (
          <div
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <MediaRenderer
              client={client}
              src="/Triumph.jpg"
              height="auto"
              width="100%"
            />
          </div>
        );
      },
      showThirdwebBranding: false,
    }}
  />
);

export default ConnectButton2;
