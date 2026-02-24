import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

export const metadata = {
  title: "Todo List",
  description: "跨裝置同步的 Todo List，支援 Daily Routine 與專案管理",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
