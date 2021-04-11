import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import client from 'lib/redis';

export default withApiAuthRequired(function handler(req, res) {
    const session = getSession(req, res);

    const mood = req.body.mood;

    const now = new Date();
    const time = now.getTime();
    const today = now.toLocaleDateString();
    const key = `user:${session.user.id}:day:${today}`;
    if (client.exists(key)) {
        return res.status(429).send();
    }
    client.hmset(key, ['timestamp', time, 'mood', mood]);
    client.incrby(`${today}:mood:${mood}`, 1);

    res.status(201).json({ timestamp: time, mood });
});
