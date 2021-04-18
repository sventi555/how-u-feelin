import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { EMOTIONS } from 'lib/constants';
import { useUser } from '@auth0/nextjs-auth0';

export default function Home() {

    // TODO: make sure you check all possible user states (isLoading, etc)
    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // TODO: useEffect to check if user already submitted

    async function handleClick(emotion, classification) {
        if (!user) {
            router.push('/api/auth/login');
        }
        setIsLoading(true);
        const response = await fetch('/api/moods', {
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
                        {Object.entries(EMOTIONS).map(([classification, emotions]) => (
                            <div key={classification}>
                                <h2 className="text-xl font-bold">{classification}</h2>
                                <ul>
                                    {emotions.map(emotion => (
                                        <li key={emotion}>
                                            <button onClick={() => handleClick(emotion, classification)}>
                                                {emotion}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
