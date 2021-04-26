import { useUser } from '@auth0/nextjs-auth0';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { EMOTIONS } from 'lib/constants';

import type { FC, ReactElement } from 'react';

interface EmotionsListProps {
    onClickEmotion: (emotion: string, classification: string ) => Promise<void>
}

const EmotionsList: FC<EmotionsListProps> = (props: EmotionsListProps): ReactElement => {
    return (
        <div>
            {Object.entries(EMOTIONS).map(([classification, emotions]) => (
                <div key={classification}>
                    <h2 className="text-xl font-bold">{classification}</h2>
                    <ul>
                        {emotions.map((emotion: string) => (
                            <li key={emotion}>
                                <button onClick={() => props.onClickEmotion(emotion, classification)}>
                                    {emotion}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const Home: FC = (): ReactElement => {

    // TODO: make sure you check all possible user states (isLoading, etc)
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // TODO: useEffect to check if user already submitted

    async function onClickEmotion(emotion: string, classification: string): Promise<void> {
        if (!user) {
            router.push('/api/auth/login');
        }
        setIsLoading(true);
        const response = await fetch('/api/emotions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emotion, classification, tzOffset: new Date().getTimezoneOffset() })
        });

        if (response.status === 201) {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <Head>
                <title>How U Feelin</title>
            </Head>
            <main>
                <h1>How U Feelin Today?</h1>
                {isLoading ? (
                    <h1 className="text-center text-3xl font-bold">Loading...</h1>
                ) : (
                    <div className="py-20">
                        <EmotionsList onClickEmotion={onClickEmotion} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
