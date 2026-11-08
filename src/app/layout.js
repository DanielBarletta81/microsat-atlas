import localFont from 'next/font/local';
import './globals.css';

const sans = localFont({
  src: [
    { path: '../../public/fonts/space-grotesk-400.ttf', weight: '400' },
    { path: '../../public/fonts/space-grotesk-600.ttf', weight: '600' },
  ],
  variable: '--font-grotesk',
  display: 'swap',
});
const serif = localFont({ src: '../../public/fonts/spectral-400.ttf', variable: '--font-spectral', display: 'swap' });

export const metadata = {
  title: 'Microsat Atlas — population genetics on the map',
  description: 'A Strata Works instrument: load microsatellite sample data (CSV, or paste from Excel) with coordinates, and read population structure as geography — outliers, trends, and distribution on an interactive coastal map.',
};

export default function RootLayout({ children }) {
  return <html lang="en" className={`${sans.variable} ${serif.variable}`}><body>{children}</body></html>;
}
