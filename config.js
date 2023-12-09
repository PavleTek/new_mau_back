import path from "path";
import { fileURLToPath } from "url";

/*  APP  */
export const APP_DIR = `${path.dirname(fileURLToPath(import.meta.url))}/`;
export const APP_HTTP_PORT = 4000;
//const HTTP_PORT = process.env.NODE_ENV === "production" ? 80 : 4000;

/*  USER AUTHORIZATION  */
export const JWT_SECRET = "Mrle ima malu pišu";

/*  FTP TRANSFER  */
export const FTP_DIR_OUTBOX = `${APP_DIR}outbox/`;
export const FTP_DIR_SENT = `${APP_DIR}sent/`;
export const FTP_FILE_NAME_TEMPLATE = /^.+_\d{8}_\d{4}\.csv$/;

/*  SAMPLES  */
export const SAMPLES_PERIOD_OFFSET_PERC = 0.02;
export const SAMPLES_DIR_HIRES = `${APP_DIR}hires/`;
export const SAMPLES_HIRES_FILE_NAME_TEMPLATE = /^RAU_\d+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.txt$/;
export const SAMPLES_BREACH_OFFSET_MINS = 1;

/*  LOGGING  */
export const LOG_DIR = `${APP_DIR}log/`;

/*  DB  */
export const DB_AUTH = {
	host: "localhost",
	port: "3306",
	user: "root",
	password: "krafttex2022",
	database: "raus",
	dateStrings: true,
	supportBigNumbers: true
};

/*  EXEC  */
export const EXEC_DIR = `${APP_DIR}run/`;

/*  WORKERS  */
export const WORKERS_INFO_DIR = `${APP_DIR}.raus/`;
export const WORKERS_FILE_NAME_TEMPLATE = /^RAUS\d+$/;

/*  TASKS  */
export const TASKS_DISPLAY_ROWS = 10;
