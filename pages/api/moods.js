import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Joi from 'joi';
import moment from 'moment';
import { EMOTIONS } from 'lib/constants';
import logger from 'lib/logger';
import withDatabaseConnection from 'lib/neo4j';

async function GETHandler(req, res) {
    // const LOG_PREFIX = '[GET /moods]';
    res.status(200).send();
}

async function POSTHandler(req, res) {
    const LOG_PREFIX = '[POST /moods]';

    const session = getSession(req, res);
    const userId = session.user.sub;

    // validate request body
    const schema = Joi.object({
        emotion: Joi.string().valid(...Object.values(EMOTIONS).reduce((acc, current) => acc.concat(current))).required(),
        classification: Joi.string().valid(...Object.keys(EMOTIONS)).required(),
        tzOffset: Joi.number().min(-720).max(840).required()
    }).required();

    const { error, value: body } = schema.validate(req.body);
    if (error) {
        logger.warn(`${LOG_PREFIX} user ${userId} submitted a bad request body - ${error}`);
        return res.status(400).json(error);
    }

    const { emotion, classification, tzOffset } = body;

    const today = moment.utc().subtract(tzOffset, 'minutes').format('YYYY-MM-DD');

    // in development, don't cap the number of submissions each day
    if (process.env.NODE_ENV === 'production') {
        // TODO: pull this logic out to reuse
        try {
            const result = await req.db.run(
                'MATCH (u:User {id: $userId}) -[:FEELS {on: date($today)}]-> (:Emotion) RETURN u',
                { userId, today }
            );
            if (result.records.length !== 0) {
                // user has already submitted today
                logger.warn(`${LOG_PREFIX} user ${userId} attempted to submit more than once on ${today}`);
                return res.status(429).send();
            }
        } catch (err) {
            logger.error(`${LOG_PREFIX} failed to check if user ${userId} already submitted on ${today} - ${err}`);
            return res.status(500).send();
        }
    }

    try {
        await req.db.run(`
                    MERGE (u:User {id: $userId})
                    MERGE (e:Emotion {name: $emotion, classification: $classification})
                    CREATE (u)-[:FEELS {on: date($today)}]->(e)
                `, { userId, emotion, classification, today });
    } catch (err) {
        logger.error(`${LOG_PREFIX} failed to record user ${userId} felt ${emotion} on ${today} - ${err}`);
        return res.status(500).send();
    }

    logger.info(`${LOG_PREFIX} successfully recorded user ${userId} felt ${emotion} on ${today}`);
    res.status(201).send();
}

export default withApiAuthRequired(
    withDatabaseConnection(
        async (req, res) => {
            switch (req.method) {
            case 'GET':
                await GETHandler(req, res);
                break;
            case 'POST':
                await POSTHandler(req, res);
                break;
            default:
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).send();
                break;
            }

        }
    )
);
