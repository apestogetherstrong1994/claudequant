export const metadata = {
  title: "ClaudeQuant — Find the story hidden in the numbers",
  description: "A PhD-level data scientist powered by Claude. Analyze data, design experiments, backtest strategies, and forecast the future.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
