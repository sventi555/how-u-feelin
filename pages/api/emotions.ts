import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import Joi from 'joi';
import moment from 'moment';
import { EMOTIONS } from 'lib/constants';
import logger from 'lib/logger';
import withDatabaseConnection from 'lib/neo4j';

import type { ValidationError } from 'joi';
import type { Session } from 'neo4j-driver';
import type { NextApiRequest, NextApiResponse} from 'next';

// ideas for data retrieval
// - mood/classification counts on a range of days
// - prevailing mood/classification over time
// - the above queries on a per user/country basis

async function GETHandler(req: NextApiRequest, res: NextApiResponse, db: Session) {
    const LOG_PREFIX = '[GET /emotions]';

    const session = getSession(req, res);
    if (!session) {
        return res.status(401).end();
    }
    const userId: string = session.user.sub;

    // validate request query
    const schema = Joi.object({
        byClassification: Joi.boolean(),
        on: Joi.date().required()
    }).required();

    interface querySchema {
        byClassification?: boolean,
        on: Date
    }

    const { error, value: query }: { error?: ValidationError, value: querySchema} = schema.validate(req.query);
    if (error) {
        logger.warn(`${LOG_PREFIX} user ${userId} submitted a bad request query - ${error}`);
        return res.status(400).json(error);
    }

    const { byClassification, on } = query;
    const dateString = moment.utc(on).format('YYYY-MM-DD');

    try {
        const result = await db.run(`
                MATCH (u:User) -[:FEELS {on: date($dateString)}]-> (e:Emotion) 
                WITH ${byClassification ? 'e.classification' : 'e.name'} AS ${byClassification ? 'classification' : 'emotion'}, size(collect(u)) as numUsers
                RETURN ${byClassification ? 'classification' : 'emotion'}, numUsers
            `, { dateString });
        const records = result.records.map((rec) => {return rec.toObject();});
        return res.status(200).send(records);
    } catch (err) {
        logger.error(`${LOG_PREFIX} failed to fetch emotions counts - ${err}`);
        return res.status(500).end();
    }
}

async function POSTHandler(req: NextApiRequest, res: NextApiResponse, db: Session) {
    const LOG_PREFIX = '[POST /emotions]';

    const session = getSession(req, res);
    if (!session) {
        return res.status(401).end();
    }
    const userId: string = session.user.sub;

    // validate request body
    const schema = Joi.object({
        emotion: Joi.string().valid(...Object.values(EMOTIONS).flat()).required(),
        classification: Joi.string().valid(...Object.keys(EMOTIONS)).required(),
        tzOffset: Joi.number().min(-840).max(720).required()
    }).required();

    interface bodySchema {
        emotion: string,
        classification: string,
        tzOffset: number
    }

    const { error, value: body }: { error?: ValidationError, value: bodySchema } = schema.validate(req.body);
    if (error) {
        logger.warn(`${LOG_PREFIX} user ${userId} submitted a bad request body - ${error}`);
        return res.status(400).json(error);
    }

    const { emotion, classification, tzOffset } = body;

    const today = moment.utc().subtract(tzOffset, 'minutes').format('YYYY-MM-DD');

    // in development, don't cap the number of submissions each day
    if (process.env.NODE_ENV === 'production') {
        // Check if the user already submitted on this day
        // TODO: pull this logic out to reuse
        try {
            const result = await db.run(
                'MATCH (u:User {id: $userId}) -[:FEELS {on: date($today)}]-> (:Emotion) RETURN u',
                { userId, today }
            );
            if (result.records.length !== 0) {
                // user has already submitted today
                logger.warn(`${LOG_PREFIX} user ${userId} attempted to submit more than once on ${today}`);
                return res.status(429).end();
            }
        } catch (err) {
            logger.error(`${LOG_PREFIX} failed to check if user ${userId} already submitted on ${today} - ${err}`);
            return res.status(500).end();
        }
    }

    // Add user emotion to the db
    try {
        await db.run(`
                MERGE (u:User {id: $userId})
                MERGE (e:Emotion {name: $emotion, classification: $classification})
                CREATE (u)-[:FEELS {on: date($today)}]->(e)
            `, { userId, emotion, classification, today });
    } catch (err) {
        logger.error(`${LOG_PREFIX} failed to record user ${userId} felt ${emotion} on ${today} - ${err}`);
        return res.status(500).end();
    }

    logger.info(`${LOG_PREFIX} successfully recorded user ${userId} felt ${emotion} on ${today}`);
    res.status(201).end();
}

export default withApiAuthRequired(
    withDatabaseConnection(
        async (req: NextApiRequest, res: NextApiResponse, db: Session): Promise<void> => {
            switch (req.method) {
            case 'GET':
                await GETHandler(req, res, db);
                break;
            case 'POST':
                await POSTHandler(req, res, db);
                break;
            default:
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).end();
                break;
            }
        }
    )
);
