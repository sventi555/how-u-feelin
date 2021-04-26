import neo4j from 'neo4j-driver';

import type { Date, Session } from 'neo4j-driver';
import type { NextApiRequest, NextApiResponse } from 'next';

export function toDateString(neoDate: Date): string {
    const year = neoDate.year.toNumber();
    const month = neoDate.month.toNumber();
    const day = neoDate.day.toNumber();

    return `${year}-${month}-${day}`;
}

export default function withDatabaseConnection(callback: (req: NextApiRequest, res: NextApiResponse, db: Session) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
        // Setup.
        const driver = neo4j.driver(process.env.NEO4J_HOST, neo4j.auth.basic(
            process.env.NEO4J_USER,
            process.env.NEO4J_PASSWORD
        ));
        const db = driver.session();

        // Function call.
        try {
            await callback(req, res, db);
        }

        // Cleanup.
        finally {
            await db.close();
        }
        await driver.close();
    };
}
