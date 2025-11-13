const express = require('express');
const router = express.Router();
const { specs, swaggerUi } = require('../docs/swagger');

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Gestion des Déchets - Documentation'
}));

module.exports = router;