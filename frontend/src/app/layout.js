import './globals.css';

export const metadata = {
  title: 'Nexus AI — Intelligent Meeting Assistant',
  description: 'Real-time AI-powered meeting assistant with transcription, summarization, and action item extraction.',
  keywords: 'AI meeting assistant, real-time transcription, meeting summary, action items, Nexus AI',
  authors: [{ name: 'Nexus AI' }],
  robots: 'index, follow',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080c18',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
