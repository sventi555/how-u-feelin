import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { EMOTIONS } from 'lib/constants';
import { useUser } from '@auth0/nextjs-auth0';

export default function Home() {

    const { user } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleClick(emotion) {
        setIsLoading(true);
        if (!user) {
            router.push('/api/auth/login');
        }
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mood: emotion })
        });

        if (response.status === 201) {
            setIsLoading(false);

            const responseJSON = await response.json();
            user.lastSubmitted = responseJSON.timestamp;
        }
    }

    return (
        <div>
            <Head>
                <title>How U Feelin</title>
            </Head>
            <main>
                <h1>How U Feelin Today?</h1>
                <a href="/api/hello">Test me</a>
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
                                            <button onClick={() => handleClick(emotion)}>
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
