import neo4j from 'neo4j-driver';

export function toDateString(neoDate) {
    const year = neoDate.year.toNumber();
    const month = neoDate.month.toNumber();
    const day = neoDate.day.toNumber();

    return new Date(`${year}-${month}-${day}`);
}

export default function withDatabaseConnection(callback) {
    return async (req, res) => {
        // Setup.
        const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(
            process.env.NEO4J_USER,
            process.env.NEO4J_PASSWORD
        ));
        req.db = driver.session();

        // Function call.
        try {
            await callback(req, res);
        }

        // Cleanup.
        finally {
            await req.db.close();
        }
        await driver.close();
    };
}
