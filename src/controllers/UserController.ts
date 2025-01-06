import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { FastifyRequest, FastifyReply } from "fastify";
import { UserRepository } from "../repositories/UserRepository";
import { createToken } from "../utils/jwt";

export class UserController {
  // Registro de novo usuário
  static async register(request: FastifyRequest, reply: FastifyReply) {
    const registerBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      city: z.string().optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
    });

    try {
      const {
        name,
        email,
        password,
        city,
        cpf,
        phone,
      } = registerBodySchema.parse(request.body);

      // Gera hash da senha
      const password_hash = await hash(password, 6);

      // Cria o novo usuário no banco de dados
      const user = await UserRepository.registerUser({
        name,
        email,
        password_hash,
        city,
        phone,
        cpf,
      });

      // Retorna sucesso
      return reply.status(201).send(user);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Campos inválidos",
          message: `${error.issues[0].path[0]}: ${error.issues[0].message}`,
        });
      }
      if (error.name === "DBerror") {
        return reply.status(400).send({
          error: "Erro no banco de dados",
          message: error.message,
        });
      }
      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  }

  // Login de usuário
  static async login(request: FastifyRequest, reply: FastifyReply) {
    const loginBodySchema = z.object({
      email: z.string(),
      password: z.string(),
    });

    try {
      const { email, password } = loginBodySchema.parse(request.body);

      const user = await UserRepository.FindUserByEmail(email);

      if (!user || !(await compare(password, user.password_hash))) {
        return reply.status(401).send({
          message: "Credenciais inválidas.",
        });
      }

      // Gera um token JWT usando o ID do usuário
      const token = createToken(user.id);

      return reply.status(200).send({
        message: "Usuário logado com sucesso",
        token, // Retorna o token JWT
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        message: "Erro ao realizar login",
      });
    }
  }

  // Obtenção de informações do usuário logado
  static async getUser(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.status(401).send({ message: "Token não encontrado." });
    }

    try {
      const user = await UserRepository.FindUserById(userId);

      if (!user) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      const { password_hash, ...userData } = user;

      return reply.send({ user: userData });
    } catch (error) {
      return reply.status(500).send({ message: "Erro ao buscar o usuário." });
    }
  }

  // Atualização de dados do usuário
  static async updateUser(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.status(401).send({ message: "Token não encontrado." });
    }

    const updateBodySchema = z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      password: z.string().optional(),
      oldPassword: z.string().optional(),
    });

    const { name, email, password, oldPassword } = updateBodySchema.parse(request.body);

    try {
      let updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      if (password) {
        if (!oldPassword) {
          return reply.status(400).send({
            message: "Senha atual é necessária para alterar a senha.",
          });
        }

        // Busca o usuário pelo ID
        const user = await UserRepository.FindUserById(userId);

        if (!user) {
          return reply.status(404).send({ message: "Usuário não encontrado." });
        }

        // Valida a senha antiga
        const isOldPasswordValid = await compare(oldPassword, user.password_hash);
        if (!isOldPasswordValid) {
          return reply.status(400).send({ message: "Senha atual incorreta." });
        }

        updateData.password_hash = await hash(password, 8);
      }

      // Atualiza o usuário no banco de dados
      const updatedUser = await UserRepository.UpdateUser(userId, updateData);

      return reply.send({
        message: "Usuário atualizado com sucesso.",
        user: updatedUser,
      });
    } catch (error: any) {
      return reply.status(500).send({ message: "Erro ao atualizar o usuário." });
    }
  }
}
