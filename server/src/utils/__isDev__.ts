import { config } from 'dotenv';
config({ path: '.env.local' });
export const isDev = () => process.env.NODE_ENV === 'development';
