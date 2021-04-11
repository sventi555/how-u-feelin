import client from 'lib/redis';

export default function handler(req, res) {
    const ping = client.ping();
    res.status(200).json({ redis: ping });
}
