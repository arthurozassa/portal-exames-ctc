const express = require('express');
const DelegationController = require('../controllers/delegationController');
const AuthMiddleware = require('../middleware/auth');
const { auditLogger } = require('../middleware/security');

const router = express.Router();

// Rotas protegidas para pacientes
router.use(AuthMiddleware.authenticatePatient);

// Listar delegações do paciente
router.get('/',
    auditLogger('view_delegations', 'delegation'),
    DelegationController.getPatientDelegations
);

// Criar nova delegação
router.post('/',
    auditLogger('create_delegation', 'delegation'),
    DelegationController.createDelegation
);

// Revogar delegação
router.delete('/:delegationId',
    auditLogger('revoke_delegation', 'delegation'),
    DelegationController.revokeDelegation
);

// Atualizar permissões de delegação
router.patch('/:delegationId/permissions',
    auditLogger('update_delegation_permissions', 'delegation'),
    DelegationController.updatePermissions
);

module.exports = router;