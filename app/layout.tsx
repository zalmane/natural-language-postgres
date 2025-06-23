import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { Sidebar } from "./components/Sidebar";
import { ProjectProvider } from "./contexts/ProjectContext";

export const metadata = {
  metadataBase: new URL("https://riverpool.ai"),
  title: "RiverPool explorer",
  description:
    "Talk to your metadata",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistMono.className} ${GeistSans.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProjectProvider>
            <div className="flex min-h-screen bg-white">
              <Sidebar />
              {children}
            </div>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
