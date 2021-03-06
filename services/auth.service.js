const boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { config } = require('../config/config');

const UsersService = require('./users.service');

class AuthService {
	constructor() {
		this.userService = new UsersService();
	}

	async getUser(email, password) {
		const user = await this.userService.findByEmail(email);
		if (!user) throw boom.unauthorized();
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) throw boom.unauthorized();
		delete user.dataValues.password;
		delete user.dataValues.createdAt;
		return user;
	}

	signToken(user) {
		const payload = { sub: user.id, role: user.role };
		const token = jwt.sign(payload, config.jwtSecret);
		return { user, token };
	}

	async sendRecovery(email) {
		const user = await this.userService.findByEmail(email);
		if (!user) throw boom.unauthorized();
		const payload = { sub: user.id };
		const token = jwt.sign(payload, config.jwtRecoverySecret, { expiresIn: '15min' });
		const link = `http://myfrontend.com/recovery?token=${token}`;
		await this.userService.update({ pk: user.id, data: { recoveryToken: token } });
		const mail = {
			from: config.mailEmail,
			to: user.email,
			subject: 'Recuperación de contraseña | YardSale',
			html: `<code>Ingresa al siguiente link => ${link}</code>`,
		};
		const response = await this.sendEmail(mail);
		return response;
	}

	async sendEmail(infomail) {
		let transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: config.mailEmail,
				pass: config.mailPassword,
			},
		});
		await transporter.sendMail(infomail);
		return { message: 'email sended' };
	}

	async changePassword({ token, newPassword }) {
		try {
			const payload = jwt.verify(token, config.jwtRecoverySecret);
			const user = await this.userService.findOne(payload.sub);
			if (user.recoveryToken !== token) throw boom.unauthorized();
			const newPasswordHashed = await bcrypt.hash(newPassword, 10);
			await this.userService.update({
				pk: user.id,
				data: { recoveryToken: null, password: newPasswordHashed },
			});
			return { message: 'password changed' };
		} catch (error) {
			throw boom.unauthorized();
		}
	}
}

module.exports = AuthService;
