import { DuckDBConnection, DuckDBValue } from '@duckdb/node-api';

type UnitOfStudy = [number, string, number, string]

export class UnitOfStudyAPI {
    // Function for setting up the required tables and sequences in the database
    async initModel(db: DuckDBConnection) {
        await db.run(`
            CREATE SEQUENCE IF NOT EXISTS UnitOfStudyIdSeq START 1
        `).then(_ => {
            db.run(`
                CREATE TABLE IF NOT EXISTS unitOfStudy (
                    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('UnitOfStudyIdSeq'),
                    code VARCHAR(32) NOT NULL,
                    name VARCHAR NOT NULL,
                    created TIMESTAMP NOT NULL,
                    modified TIMESTAMP NOT NULL,
                )
            `)
        })
    }

    async listUnitsOfStudy(db: DuckDBConnection, coordinatorId: number): Promise<DuckDBValue[][]> {
        const reader = await db.runAndReadAll(`
            SELECT * FROM unitOfStudy;
        `);

        return reader.getRows();
    }

    async newUnitOfStudy(db: DuckDBConnection, code: string, name: string): Promise<[number, string, string]> {
        const insert = await db.prepare(`
            INSERT INTO unitOfStudy (code, name, created, modified) VALUES (?, ?, current_timestamp, current_timestamp) RETURNING (id)
            `);
        insert.bind([code, name]);
        const reader = await insert.runAndReadAll();

        return [reader.getRows()[0][0] as number, code, name]
    }
}