import { DuckDBConnection, DuckDBValue, DuckDBPreparedStatement } from '@duckdb/node-api';

export interface UnitOfStudy {
    code: string;
    name: string;
    year: number;
    session: number;
    siteId: string | null;
}

export class UnitOfStudyRecord implements UnitOfStudy {
    id: number;
    code: string;
    name: string;
    year: number;
    session: number;
    siteId: string | null;

    constructor(id: number, code: string, name: string, year: number, session: number, siteId: string) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.year = year;
        this.session = session;
        this.siteId = siteId;
    }
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

    async listUnitsOfStudy(db: DuckDBConnection): Promise<UnitOfStudyRecord[]> {
        const reader = await db.runAndReadAll(`
            SELECT id, code, name, year, session, lms_site_id FROM unitOfStudy;
        `);

        return reader.getRows().map(row => new UnitOfStudyRecord(
                row[0] as number,
                row[1] as string,
                row[2] as string,
                row[3] as number,
                row[4] as number,
                row[5] as string,
        ));
    }

    async newUnitOfStudy(db: DuckDBConnection, uos: UnitOfStudy): Promise<UnitOfStudyRecord> {
        const insert = await db.prepare(`
            INSERT INTO unitOfStudy (code, name, year, session, lms_site_id, created, modified) VALUES (?, ?, ?, ?, ?, current_timestamp, current_timestamp) RETURNING (id)
            `);

        // Bind happy path values in bulk
        const values = [uos.code, uos.name, uos.year, uos.session];
        insert.bind(values);

        // Handle dispatching to null when needed
        bindMaybe(insert, (s, v) => s.bindVarchar(5, v), uos.siteId)

        // Go!
        const reader = await insert.runAndReadAll();

        return {
            id: reader.getRows()[0][0] as number,
            ...uos
        }
    }
}

function bindMaybe<T>(statement: DuckDBPreparedStatement, binder: (statement: DuckDBPreparedStatement, value: NonNullable<T>) => any, value: T) {
    // Handle dispatching to null when needed
    if (value === null || value === undefined) {
        statement.bindNull(5)
    }
    else {
        binder(statement, value)
    }
}
