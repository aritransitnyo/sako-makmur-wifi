import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Head>
        <title>Sako Makmur WiFi - Executive ISP Management</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#090d16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sako WiFi" />
        <meta name="description" content="Dashboard Eksekutif Bisnis & Manajemen Pelanggan PPPoE ISP Starlink" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
