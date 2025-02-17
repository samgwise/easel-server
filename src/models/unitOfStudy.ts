import { DuckDBConnection, DuckDBValue } from '@duckdb/node-api';

export interface UnitOfStudy {
    code: string;
    name: string;
    year: number;
    session: number;
    siteId: string|null;
}

export interface UnitOfStudyRecord extends UnitOfStudy {
    id: number
}

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
                    year INTEGER,
                    session TINYINT NOT NULL,
                    lms_site_id VARCHAR,
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

    async newUnitOfStudy(db: DuckDBConnection, uos: UnitOfStudy): Promise<UnitOfStudyRecord> {
        const insert = await db.prepare(`
            INSERT INTO unitOfStudy (code, name, year, session, lms_site_id, created, modified) VALUES (?, ?, ?, ?, ?, current_timestamp, current_timestamp) RETURNING (id)
            `);

        // Bind happy path values in bulk
        const values = [uos.code, uos.name, uos.year, uos.session];
        insert.bind(values);

        // Handle dispatching to null when needed
        if (uos.siteId === null) {
            insert.bindNull(5)
        }
        else {
            insert.bindVarchar(5, uos.siteId)
        }

        // Go!
        const reader = await insert.runAndReadAll();

        return {
            id: reader.getRows()[0][0] as number,
            ...uos
        }
    }
}