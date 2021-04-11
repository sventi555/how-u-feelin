import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>How U Feelin</title>
      </Head>
      <main>
        <h1>How U Feelin Today?</h1>
        <a href="/api/hello">Test me</a>
      </main>
    </div>
  )
}
