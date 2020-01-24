// Global variables
require('./bootstrap/globals');

// Extend prototypes
require('./bootstrap/prototypes');

// Typescript stack traces
require('source-map-support').install();

// Improved module resolution
require('./bootstrap/resolver');

// Start the framework
require('@core/framework').Framework.start().catch(err => {
    console.error('Failed to start the bot:', err);
    process.exit(1);
});
