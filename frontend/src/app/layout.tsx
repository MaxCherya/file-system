'use client';

import { ToastContainer } from "react-toastify";
import "./globals.css";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <QueryClientProvider client={queryClient}>

          {/* TOP BAR */}
          <nav className="w-full bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
            <Link href="/" className="font-semibold text-lg">📁 File System</Link>
            <div className="flex gap-4">
              <Link href="/" className="hover:underline">🏠</Link>
              <Link href="/trash" className="hover:underline">🗑️</Link>
              <Link href="/search" className="hover:underline">🔎</Link>
            </div>
          </nav>

          {/* MAIN PAGE CONTENT */}
          <main>{children}</main>

        </QueryClientProvider>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </body>
    </html>
  );
}