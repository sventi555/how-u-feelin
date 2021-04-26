import neo4j from 'neo4j-driver';

import type { Session } from 'neo4j-driver';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function withDatabaseConnection(callback: (req: NextApiRequest, res: NextApiResponse, db: Session) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
        // Setup.
        const driver = neo4j.driver(process.env.NEO4J_HOST ?? 'bolt://localhost:7687', neo4j.auth.basic(
            process.env.NEO4J_USER ?? 'neo4j',
            process.env.NEO4J_PASSWORD ?? 'password'
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
