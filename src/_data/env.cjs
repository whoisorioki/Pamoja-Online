require('dotenv').config();

module.exports = function() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    JAAS_APP_ID: process.env.JAAS_APP_ID || 'vpaas-magic-cookie-98cd250b16ba47b9b4c874147a71d5c7'
  };
};
