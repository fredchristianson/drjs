// conditional imports can't be done, so import all env definitions 
// then select the correct one
import env_prod from './browser/browser-env-prod.js';
import env_dev from './browser/browser-env-dev.js';

var env = null;
if (typeof process === 'undefined') {
    // browser, so set to the correct env file.
    if (location.port == "60800") {
        env = env_dev;
    } else {
        env = env_prod;
    }
} else {
    // node.js
    env = process.env;
}

export default env;