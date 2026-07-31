import type { AppProps } from 'next/app';
import { Theme } from '@carbon/react';
import '@/styles/globals.scss';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme theme="white">
      <Component {...pageProps} />
    </Theme>
  );
}
