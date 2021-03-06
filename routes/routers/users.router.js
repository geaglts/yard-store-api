const { Router } = require('express');
const UsersService = require('../../services/users.service');
const response = require('../../utils/response');

const validationHandler = require('../../middlewares/validation.handler');
const {
	createUserSchema,
	updateUserSchema,
	getUserSchema,
} = require('../../schemas/user.schema');

const router = Router();
const service = new UsersService();

router.get('/', async (req, res, next) => {
	try {
		const data = await service.find();
		response({ res, message: 'all users', body: data });
	} catch (error) {
		next(error);
	}
});

router.post('/register', validationHandler(createUserSchema), async (req, res, next) => {
	try {
		const user = req.body;
		const data = await service.register({ user });
		response({ res, ...data, status: 201 });
	} catch (error) {
		next(error);
	}
});

router.get('/:id', validationHandler(getUserSchema, 'params'), async (req, res, next) => {
	const { id } = req.params;
	try {
		const body = await service.findOne(id);
		response({ res, message: 'user', body });
	} catch (error) {
		next(error);
	}
});

router.patch(
	'/:id',
	validationHandler(getUserSchema, 'params'),
	validationHandler(updateUserSchema),
	async (req, res, next) => {
		const { id } = req.params;
		try {
			const { message, body } = await service.update({ pk: id, data: req.body });
			response({ res, message, body });
		} catch (error) {
			next(error);
		}
	}
);

router.delete('/:id', validationHandler(getUserSchema, 'params'), async (req, res, next) => {
	const { id } = req.params;
	try {
		const { message, body } = await service.remove(id);
		response({ res, message, body });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
