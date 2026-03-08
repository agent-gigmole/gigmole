import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AppWalletProvider } from "@/components/wallet-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppWalletProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AppWalletProvider>
  );
}
