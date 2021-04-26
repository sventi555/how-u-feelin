import { UserProvider } from '@auth0/nextjs-auth0';
import 'styles/globals.css';

import type { AppProps } from 'next/app';
import type { FC, ReactElement } from 'react';

const MyApp: FC<AppProps> = ({ Component, pageProps }: AppProps): ReactElement => {
    return (
        <UserProvider>
            <Component {...pageProps} />
        </UserProvider>
    );
};

export default MyApp;
